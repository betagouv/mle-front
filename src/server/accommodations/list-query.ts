import { and, eq, notInArray, or, type SQL, sql } from 'drizzle-orm'
import { EResidenceType } from '~/enums/residence-type'
import { ETargetAudience } from '~/enums/target-audience'
import { db } from '~/server/db'
import { academies } from '~/server/db/schema/academies'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodations } from '~/server/db/schema/accommodations'
import { cities } from '~/server/db/schema/cities'
import { departments } from '~/server/db/schema/departments'
import { externalSources } from '~/server/db/schema/external-sources'
import { owners } from '~/server/db/schema/owners'

/**
 * Query builders partagés pour lister les accommodations.
 *
 * Ce module est la source de vérité de la requête « liste de résidences » : il est consommé à la fois
 * par le router tRPC interne (`accommodationsRouter`) et par l'API publique REST v1, garantissant que
 * les deux surfaces renvoient exactement le même contenu (iso carte).
 */

const availabilityCols = [
  accommodations.nbT1Available,
  accommodations.nbT1BisAvailable,
  accommodations.nbT2Available,
  accommodations.nbT3Available,
  accommodations.nbT4Available,
  accommodations.nbT5Available,
  accommodations.nbT6Available,
  accommodations.nbT7MoreAvailable,
] as const

// Raw column names used inside CTE ordering (no table qualification)
const totalAvailable = sql<number>`(
  COALESCE("nbT1Available", 0) +
  COALESCE("nbT1BisAvailable", 0) +
  COALESCE("nbT2Available", 0) +
  COALESCE("nbT3Available", 0) +
  COALESCE("nbT4Available", 0) +
  COALESCE("nbT5Available", 0) +
  COALESCE("nbT6Available", 0) +
  COALESCE("nbT7MoreAvailable", 0)
)`

const unknownAvailability = sql<boolean>`(
  "nbT1Available" IS NULL AND
  "nbT1BisAvailable" IS NULL AND
  "nbT2Available" IS NULL AND
  "nbT3Available" IS NULL AND
  "nbT4Available" IS NULL AND
  "nbT5Available" IS NULL AND
  "nbT6Available" IS NULL AND
  "nbT7MoreAvailable" IS NULL
)`

const priorityOrder = sql`CASE
  WHEN ${totalAvailable} > 0 THEN 1
  WHEN ${totalAvailable} = 0 AND "acceptWaitingList" = true AND NOT ${unknownAvailability} THEN 2
  WHEN ${unknownAvailability} AND "acceptWaitingList" = true THEN 3
  WHEN ${unknownAvailability} AND ("acceptWaitingList" IS NULL OR "acceptWaitingList" = false) THEN 4
  WHEN ${totalAvailable} = 0 AND ("acceptWaitingList" IS NULL OR "acceptWaitingList" = false) AND NOT ${unknownAvailability} THEN 5
  ELSE 6
END`

export const priceMaxComputed = sql<number | null>`GREATEST(
  ${accommodations.priceMaxT1},
  ${accommodations.priceMaxT1Bis},
  ${accommodations.priceMaxT2},
  ${accommodations.priceMaxT3},
  ${accommodations.priceMaxT4},
  ${accommodations.priceMaxT5},
  ${accommodations.priceMaxT6},
  ${accommodations.priceMaxT7More}
)`

export const crousExistsCondition = sql`EXISTS (SELECT 1 FROM ${externalSources} WHERE ${externalSources.accommodationId} = ${accommodations.id} AND ${externalSources.source} = 'crous')`

const residenceTypeValues = new Set<string>(Object.values(EResidenceType))
const targetAudienceValues = new Set<string>(Object.values(ETargetAudience))

export function toResidenceType(value: string | null): EResidenceType | null {
  return value && residenceTypeValues.has(value) ? (value as EResidenceType) : null
}

export function toTargetAudience(value: string | null): ETargetAudience | null {
  return value && targetAudienceValues.has(value) ? (value as ETargetAudience) : null
}

export type TCommonListFiltersInput = {
  hasColiving?: boolean
  isAccessible?: boolean
  onlyWithAvailability?: boolean
  ownerSlug?: string
  priceMax?: number
  viewCrous: boolean
  // Quand true, ne pas appliquer le filtre crous ici (l'appelant l'applique lui-même, ex. pour compter les deux buckets).
  skipCrous?: boolean
}

export const applyCommonListFilters = async (conditions: SQL[], input: TCommonListFiltersInput) => {
  const { hasColiving, isAccessible, onlyWithAvailability, ownerSlug, priceMax, viewCrous, skipCrous } = input

  if (isAccessible) {
    conditions.push(sql`${accommodations.nbAccessibleApartments} > 0`)
  }

  if (hasColiving) {
    conditions.push(sql`${accommodations.nbColivingApartments} > 0`)
  }

  if (onlyWithAvailability) {
    const orAvailable = availabilityCols.map((col) => sql`${col} > 0`)
    conditions.push(sql`(${sql.join(orAvailable, sql` OR `)})`)
  }

  if (priceMax != null) {
    conditions.push(sql`${accommodations.priceMin} IS NOT NULL AND ${accommodations.priceMin} <= ${priceMax}`)
  }

  if (!skipCrous) {
    conditions.push(viewCrous ? crousExistsCondition : sql`NOT (${crousExistsCondition})`)
  }

  if (ownerSlug) {
    const ownerResult = await db.select({ id: owners.id }).from(owners).where(eq(owners.slug, ownerSlug)).limit(1)

    if (ownerResult.length > 0) {
      conditions.push(eq(accommodations.ownerId, ownerResult[0].id))
    }
  }
}

export const applyCenterRadiusFilter = (conditions: SQL[], center: string, radius: number) => {
  const [lng, lat] = center.split(',').map(Number)
  const radiusMeters = radius * 1000
  conditions.push(
    sql`ST_DWithin(${accommodationAddresses.geom}::geography, ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, ${radiusMeters})`,
  )
}

/**
 * Construit le filtre de localisation géométrique (iso carte) pour l'API publique.
 *
 * Chaque dimension fournie (slugs de villes, départements par slug/code, académies par slug) produit
 * une sous-requête `EXISTS` corrélée qui applique `ST_Within(geom, boundary)` — exactement la même
 * sémantique que le filtre mono-ville de la carte, mais généralisée au multi-territoire et
 * index-friendly (pas de polygone matérialisé côté application). Les codes postaux sont un filtre
 * attributaire (`postal_code IN (...)`).
 *
 * Les dimensions renseignées sont combinées en `OR` (union des zones/attributs) : un consommateur qui
 * passe plusieurs villes récupère l'union de ces villes.
 *
 * @returns un prédicat SQL, ou `null` si aucune dimension de localisation n'est fournie.
 */
export const resolveLocationConditions = (input: {
  citySlugs?: string[]
  departments?: string[]
  academies?: string[]
  postalCodes?: string[]
}): SQL | null => {
  const terms: SQL[] = []

  if (input.citySlugs?.length) {
    const values = input.citySlugs.map((s) => sql`${s.trim().toLowerCase()}`)
    terms.push(
      sql`EXISTS (SELECT 1 FROM ${cities} loc_c WHERE LOWER(loc_c.slug) IN (${sql.join(values, sql`, `)}) AND ST_Within(${accommodationAddresses.geom}, loc_c.boundary))`,
    )
  }

  if (input.departments?.length) {
    const tokens = input.departments.map((d) => d.trim())
    const lowered = tokens.map((d) => sql`${d.toLowerCase()}`)
    const codes = tokens.map((d) => sql`${d}`)
    terms.push(
      sql`EXISTS (SELECT 1 FROM ${departments} loc_d WHERE (LOWER(loc_d.slug) IN (${sql.join(lowered, sql`, `)}) OR loc_d.code IN (${sql.join(codes, sql`, `)})) AND ST_Within(${accommodationAddresses.geom}, loc_d.boundary))`,
    )
  }

  if (input.academies?.length) {
    const values = input.academies.map((s) => sql`${s.trim().toLowerCase()}`)
    terms.push(
      sql`EXISTS (SELECT 1 FROM ${academies} loc_a WHERE LOWER(loc_a.slug) IN (${sql.join(values, sql`, `)}) AND ST_Within(${accommodationAddresses.geom}, loc_a.boundary))`,
    )
  }

  if (input.postalCodes?.length) {
    const values = input.postalCodes.map((p) => sql`${p.trim()}`)
    terms.push(sql`${accommodationAddresses.postalCode} IN (${sql.join(values, sql`, `)})`)
  }

  if (terms.length === 0) return null
  return terms.length === 1 ? terms[0] : (or(...terms) as SQL)
}

export const listAccommodationsWithConditions = async ({
  page,
  pageSize,
  where,
  whereWithoutCrous,
  addressOrderHint,
}: {
  page: number
  pageSize: number
  where: SQL | undefined
  // Mêmes conditions que `where` mais sans le filtre crous : sert à compter les deux buckets (crous / autres).
  whereWithoutCrous?: SQL
  addressOrderHint?: SQL
}) => {
  const offset = (page - 1) * pageSize
  const addressOrder = addressOrderHint ?? sql`${accommodationAddresses.isMain} DESC`
  const whereClause = where ? sql`WHERE ${where}` : sql``

  // Use a CTE: first deduplicate with DISTINCT ON, then sort + paginate on top
  const [countResult, priceBounds, results, crousCountsResult] = await Promise.all([
    db
      .select({ count: sql<number>`count(DISTINCT ${accommodations.id})::int` })
      .from(accommodations)
      .innerJoin(accommodationAddresses, eq(accommodationAddresses.accommodationId, accommodations.id))
      .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
      .where(where),

    db
      .select({
        minPrice: sql<number | null>`MIN(LEAST(
              NULLIF(${accommodations.priceMinT1}, 0),
              NULLIF(${accommodations.priceMinT1Bis}, 0),
              NULLIF(${accommodations.priceMinT2}, 0),
              NULLIF(${accommodations.priceMinT3}, 0),
              NULLIF(${accommodations.priceMinT4}, 0),
              NULLIF(${accommodations.priceMinT5}, 0),
              NULLIF(${accommodations.priceMinT6}, 0),
              NULLIF(${accommodations.priceMinT7More}, 0)
            ))`,
        maxPrice: sql<number | null>`MAX(GREATEST(
              NULLIF(${accommodations.priceMaxT1}, 0),
              NULLIF(${accommodations.priceMaxT1Bis}, 0),
              NULLIF(${accommodations.priceMaxT2}, 0),
              NULLIF(${accommodations.priceMaxT3}, 0),
              NULLIF(${accommodations.priceMaxT4}, 0),
              NULLIF(${accommodations.priceMaxT5}, 0),
              NULLIF(${accommodations.priceMaxT6}, 0),
              NULLIF(${accommodations.priceMaxT7More}, 0)
            ))`,
      })
      .from(accommodations)
      .innerJoin(accommodationAddresses, eq(accommodationAddresses.accommodationId, accommodations.id))
      .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
      .where(where),

    db.execute<Record<string, unknown>>(sql`
      WITH deduped AS (
        SELECT DISTINCT ON (${accommodations.id})
          ${accommodations.id} as id,
          ${accommodations.name} as name,
          ${accommodations.slug} as slug,
          ${accommodations.description} as description,
          ${accommodationAddresses.address} as address,
          ${cities.name} as city,
          ${cities.slug} as "citySlug",
          ${accommodationAddresses.postalCode} as "postalCode",
          ${accommodations.residenceType} as "residenceType",
          ${accommodations.target_audience} as "targetAudience",
          ${accommodations.published} as published,
          ${accommodations.nbTotalApartments} as "nbTotalApartments",
          ${accommodations.nbAccessibleApartments} as "nbAccessibleApartments",
          ${accommodations.nbColivingApartments} as "nbColivingApartments",
          ${accommodations.nbT1} as "nbT1",
          ${accommodations.nbT1Bis} as "nbT1Bis",
          ${accommodations.nbT2} as "nbT2",
          ${accommodations.nbT3} as "nbT3",
          ${accommodations.nbT4} as "nbT4",
          ${accommodations.nbT5} as "nbT5",
          ${accommodations.nbT6} as "nbT6",
          ${accommodations.nbT7More} as "nbT7More",
          ${accommodations.nbT1Available} as "nbT1Available",
          ${accommodations.nbT1BisAvailable} as "nbT1BisAvailable",
          ${accommodations.nbT2Available} as "nbT2Available",
          ${accommodations.nbT3Available} as "nbT3Available",
          ${accommodations.nbT4Available} as "nbT4Available",
          ${accommodations.nbT5Available} as "nbT5Available",
          ${accommodations.nbT6Available} as "nbT6Available",
          ${accommodations.nbT7MoreAvailable} as "nbT7MoreAvailable",
          ${accommodations.priceMin} as "priceMin",
          ${accommodations.priceMinT1} as "priceMinT1",
          ${accommodations.priceMaxT1} as "priceMaxT1",
          ${accommodations.priceMinT1Bis} as "priceMinT1Bis",
          ${accommodations.priceMaxT1Bis} as "priceMaxT1Bis",
          ${accommodations.priceMinT2} as "priceMinT2",
          ${accommodations.priceMaxT2} as "priceMaxT2",
          ${accommodations.priceMinT3} as "priceMinT3",
          ${accommodations.priceMaxT3} as "priceMaxT3",
          ${accommodations.priceMinT4} as "priceMinT4",
          ${accommodations.priceMaxT4} as "priceMaxT4",
          ${accommodations.priceMinT5} as "priceMinT5",
          ${accommodations.priceMaxT5} as "priceMaxT5",
          ${accommodations.priceMinT6} as "priceMinT6",
          ${accommodations.priceMaxT6} as "priceMaxT6",
          ${accommodations.priceMinT7More} as "priceMinT7More",
          ${accommodations.priceMaxT7More} as "priceMaxT7More",
          ${accommodations.superficieMinT1} as "superficieMinT1",
          ${accommodations.superficieMaxT1} as "superficieMaxT1",
          ${accommodations.superficieMinT1Bis} as "superficieMinT1Bis",
          ${accommodations.superficieMaxT1Bis} as "superficieMaxT1Bis",
          ${accommodations.superficieMinT2} as "superficieMinT2",
          ${accommodations.superficieMaxT2} as "superficieMaxT2",
          ${accommodations.superficieMinT3} as "superficieMinT3",
          ${accommodations.superficieMaxT3} as "superficieMaxT3",
          ${accommodations.superficieMinT4} as "superficieMinT4",
          ${accommodations.superficieMaxT4} as "superficieMaxT4",
          ${accommodations.superficieMinT5} as "superficieMinT5",
          ${accommodations.superficieMaxT5} as "superficieMaxT5",
          ${accommodations.superficieMinT6} as "superficieMinT6",
          ${accommodations.superficieMaxT6} as "superficieMaxT6",
          ${accommodations.superficieMinT7More} as "superficieMinT7More",
          ${accommodations.superficieMaxT7More} as "superficieMaxT7More",
          ${priceMaxComputed} as "priceMaxComputed",
          ${accommodations.acceptWaitingList} as "acceptWaitingList",
          ${accommodations.scholarshipHoldersPriority} as "scholarshipHoldersPriority",
          ${accommodations.socialHousingRequired} as "socialHousingRequired",
          ${accommodations.wifi} as wifi,
          ${accommodations.imagesUrls} as "imagesUrls",
          ${accommodations.externalUrl} as "externalUrl",
          ${accommodations.virtualTourUrl} as "virtualTourUrl",
          ${accommodations.updatedAt} as "updatedAt",
          ${owners.name} as "ownerName",
          ${owners.url} as "ownerUrl",
          ST_Y(${accommodationAddresses.geom}::geometry) as lat,
          ST_X(${accommodationAddresses.geom}::geometry) as lng
        FROM ${accommodations}
        INNER JOIN ${accommodationAddresses} ON ${accommodationAddresses.accommodationId} = ${accommodations.id}
        INNER JOIN ${cities} ON ${cities.id} = ${accommodationAddresses.cityId}
        LEFT JOIN ${owners} ON ${owners.id} = ${accommodations.ownerId}
        ${whereClause}
        ORDER BY ${accommodations.id}, ${addressOrder}
      )
      SELECT * FROM deduped
      ORDER BY ${priorityOrder} ASC, ${totalAvailable} DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `),

    // Counts par bucket crous / autres, sur les mêmes conditions mais sans le filtre crous.
    whereWithoutCrous
      ? db
          .select({
            crous: sql<number>`count(DISTINCT ${accommodations.id}) FILTER (WHERE ${crousExistsCondition})::int`,
            others: sql<number>`count(DISTINCT ${accommodations.id}) FILTER (WHERE NOT (${crousExistsCondition}))::int`,
          })
          .from(accommodations)
          .innerJoin(accommodationAddresses, eq(accommodationAddresses.accommodationId, accommodations.id))
          .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
          .where(whereWithoutCrous)
      : Promise.resolve(null),
  ])

  const count = countResult[0]?.count ?? 0
  const totalPages = Math.ceil(count / pageSize)

  return {
    count,
    page_size: pageSize,
    min_price: priceBounds[0]?.minPrice != null ? Number(priceBounds[0].minPrice) : null,
    max_price: priceBounds[0]?.maxPrice != null ? Number(priceBounds[0].maxPrice) : null,
    crousCounts: crousCountsResult?.[0] ? { crous: crousCountsResult[0].crous, others: crousCountsResult[0].others } : undefined,
    next: page < totalPages ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    results: {
      features: (Array.isArray(results) ? results : (results as { rows: Record<string, unknown>[] }).rows).map(mapToGeoJsonFeature),
    },
  }
}

export function mapToGeoJsonFeature(row: Record<string, unknown>) {
  // bigint columns come back as strings from raw SQL queries (db.execute) but as numbers from typed selects
  const id = typeof row.id === 'string' ? Number(row.id) : (row.id as number)
  return {
    geometry: {
      type: 'Point' as const,
      coordinates: [row.lng as number, row.lat as number],
    },
    id,
    properties: {
      id,
      name: row.name as string,
      slug: row.slug as string,
      address: (row.address as string) ?? '',
      city: row.city as string,
      city_slug: row.citySlug as string,
      postal_code: row.postalCode as string,
      residence_type: toResidenceType((row.residenceType as string | null) ?? null),
      target_audience: toTargetAudience((row.targetAudience as string | null) ?? null),
      published: row.published as boolean,
      accept_waiting_list: (row.acceptWaitingList as boolean) ?? false,
      images_urls: (row.imagesUrls as string[]) ?? null,
      description: (row.description as string) ?? null,
      rental_charges_details: (row.rentalChargesDetails as string) ?? null,
      external_url: (row.externalUrl as string) ?? undefined,
      virtual_tour_url: (row.virtualTourUrl as string) ?? null,
      updated_at: row.updatedAt as Date,
      scholarship_holders_priority: (row.scholarshipHoldersPriority as boolean) ?? false,
      social_housing_required: (row.socialHousingRequired as boolean) ?? false,
      wifi: (row.wifi as boolean) ?? false,
      nb_total_apartments: row.nbTotalApartments as number | null,
      nb_accessible_apartments: row.nbAccessibleApartments as number | null,
      nb_coliving_apartments: row.nbColivingApartments as number | null,
      nb_t1: row.nbT1 as number | null,
      nb_t1_bis: row.nbT1Bis as number | null,
      nb_t2: row.nbT2 as number | null,
      nb_t3: row.nbT3 as number | null,
      nb_t4: row.nbT4 as number | null,
      nb_t5: row.nbT5 as number | null,
      nb_t6: row.nbT6 as number | null,
      nb_t7_more: row.nbT7More as number | null,
      nb_t1_available: row.nbT1Available as number | null,
      nb_t1_bis_available: row.nbT1BisAvailable as number | null,
      nb_t2_available: row.nbT2Available as number | null,
      nb_t3_available: row.nbT3Available as number | null,
      nb_t4_available: row.nbT4Available as number | null,
      nb_t5_available: row.nbT5Available as number | null,
      nb_t6_available: row.nbT6Available as number | null,
      nb_t7_more_available: row.nbT7MoreAvailable as number | null,
      price_min: row.priceMin as number | null,
      price_min_t1: row.priceMinT1 as number | null,
      price_min_t1_bis: row.priceMinT1Bis as number | null,
      price_min_t2: row.priceMinT2 as number | null,
      price_min_t3: row.priceMinT3 as number | null,
      price_min_t4: row.priceMinT4 as number | null,
      price_min_t5: row.priceMinT5 as number | null,
      price_min_t6: row.priceMinT6 as number | null,
      price_min_t7_more: row.priceMinT7More as number | null,
      price_max: row.priceMaxComputed as number | null,
      price_max_t1: row.priceMaxT1 as number | null,
      price_max_t1_bis: row.priceMaxT1Bis as number | null,
      price_max_t2: row.priceMaxT2 as number | null,
      price_max_t3: row.priceMaxT3 as number | null,
      price_max_t4: row.priceMaxT4 as number | null,
      price_max_t5: row.priceMaxT5 as number | null,
      price_max_t6: row.priceMaxT6 as number | null,
      price_max_t7_more: row.priceMaxT7More as number | null,
      superficie_min_t1: row.superficieMinT1 as number | null,
      superficie_max_t1: row.superficieMaxT1 as number | null,
      superficie_min_t1_bis: row.superficieMinT1Bis as number | null,
      superficie_max_t1_bis: row.superficieMaxT1Bis as number | null,
      superficie_min_t2: row.superficieMinT2 as number | null,
      superficie_max_t2: row.superficieMaxT2 as number | null,
      superficie_min_t3: row.superficieMinT3 as number | null,
      superficie_max_t3: row.superficieMaxT3 as number | null,
      superficie_min_t4: row.superficieMinT4 as number | null,
      superficie_max_t4: row.superficieMaxT4 as number | null,
      superficie_min_t5: row.superficieMinT5 as number | null,
      superficie_max_t5: row.superficieMaxT5 as number | null,
      superficie_min_t6: row.superficieMinT6 as number | null,
      superficie_max_t6: row.superficieMaxT6 as number | null,
      superficie_min_t7_more: row.superficieMinT7More as number | null,
      superficie_max_t7_more: row.superficieMaxT7More as number | null,
      owner_name: (row.ownerName as string) ?? null,
      owner_url: (row.ownerUrl as string) ?? null,
    },
  }
}

/**
 * Requête haut-niveau consommée par l'API publique REST v1 (`GET /v1/accommodations`).
 *
 * Elle reprend la logique du router tRPC `accommodations.list` (mêmes filtres communs, même shape de
 * sortie GeoJSON) mais en remplaçant le scope mono-ville par le filtre de localisation multi-territoire
 * de `resolveLocationConditions`. `bbox` / `center` restent disponibles comme scopes géométriques
 * alternatifs, avec la même priorité que le router.
 *
 * Le filtre CROUS est tri-état, plus adapté à un consommateur d'API que le binaire de la carte :
 * `undefined` = toutes les résidences, `true` = CROUS uniquement, `false` = hors CROUS.
 */
export const queryPublicAccommodations = async (input: {
  page: number
  pageSize: number
  citySlugs?: string[]
  departments?: string[]
  academies?: string[]
  postalCodes?: string[]
  bbox?: string
  center?: string
  radius: number
  isAccessible?: boolean
  hasColiving?: boolean
  onlyWithAvailability?: boolean
  priceMax?: number
  viewCrous?: boolean
  ownerSlug?: string
  excludeIds?: number[]
}) => {
  const { page, pageSize, bbox, center, radius } = input

  const conditions: SQL[] = [eq(accommodations.published, true), sql`${accommodationAddresses.geom} IS NOT NULL`]
  // On applique tous les filtres SAUF crous (skipCrous), le filtre crous est ajouté par-dessus ci-dessous.
  await applyCommonListFilters(conditions, { ...input, viewCrous: input.viewCrous ?? false, skipCrous: true })

  // Localisation : d'abord les dimensions slug/CP (union), sinon bbox, sinon center+rayon.
  const locationCondition = resolveLocationConditions(input)
  if (locationCondition) {
    conditions.push(locationCondition)
  } else if (bbox) {
    const parts = bbox.split(',').map(Number)
    if (parts.length === 4) {
      const [xmin, ymin, xmax, ymax] = parts
      conditions.push(sql`ST_Intersects(${accommodationAddresses.geom}, ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}, 4326))`)
    }
  } else if (center) {
    applyCenterRadiusFilter(conditions, center, radius)
  }

  if (input.excludeIds?.length) {
    conditions.push(notInArray(accommodations.id, input.excludeIds))
  }

  const whereWithoutCrous = and(...conditions)
  // CROUS tri-état : undefined → pas de filtre (toutes) + pas de comptage par bucket.
  const where =
    input.viewCrous === undefined
      ? whereWithoutCrous
      : and(whereWithoutCrous, input.viewCrous ? crousExistsCondition : sql`NOT (${crousExistsCondition})`)
  return listAccommodationsWithConditions({
    page,
    pageSize,
    where,
    whereWithoutCrous: input.viewCrous === undefined ? undefined : whereWithoutCrous,
  })
}
