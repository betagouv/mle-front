import { and, eq, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { accommodationAddresses } from '../../../src/server/db/schema/accommodation-addresses'
import { accommodationTypologies } from '../../../src/server/db/schema/accommodation-typologies'
import { accommodations } from '../../../src/server/db/schema/accommodations'
import { cities } from '../../../src/server/db/schema/cities'

export type TAccommodationSample = {
  id: number
  name: string
  slug: string
  cityName: string
  url: string
  score: number
  descriptionLength: number
  imagesCount: number
  hasVirtualTour: boolean
  equipmentsCount: number
  typologiesCount: number
}

// coalesce obligatoire : un seul booléen NULL suffirait à annuler toute la somme.
const EQUIPMENTS = sql`(
  coalesce(${accommodations.laundryRoom}, false)::int + coalesce(${accommodations.commonAreas}, false)::int
  + coalesce(${accommodations.bikeStorage}, false)::int + coalesce(${accommodations.parking}, false)::int
  + coalesce(${accommodations.secureAccess}, false)::int + coalesce(${accommodations.residenceManager}, false)::int
  + coalesce(${accommodations.desk}, false)::int + coalesce(${accommodations.cookingPlates}, false)::int
  + coalesce(${accommodations.microwave}, false)::int + coalesce(${accommodations.refrigerator}, false)::int
  + coalesce(${accommodations.wifi}, false)::int
)`

/**
 * Sélectionne les fiches logement les plus « riches » : on audite la page qui expose le plus
 * d'objets à contrôler. Le poids élevé de la visite virtuelle est délibéré — c'est le seul
 * moyen d'exercer les critères 2.1/2.2 (cadres) sur une fiche réelle. Lecture seule.
 */
export async function selectAccommodationCandidates(slug?: string): Promise<TAccommodationSample[]> {
  const typologyCounts = db
    .select({
      accommodationId: accommodationTypologies.accommodationId,
      count: sql<number>`count(*)`.as('typologies_count'),
    })
    .from(accommodationTypologies)
    .groupBy(accommodationTypologies.accommodationId)
    .as('typology_counts')

  const score = sql<number>`(
    least(length(coalesce(${accommodations.description}, '')), 1500) / 150.0
    + least(coalesce(array_length(${accommodations.imagesUrls}, 1), 0), 10)
    + 12 * coalesce(${accommodations.virtualTourUrl} <> '', false)::int
    + 4 * (${accommodations.externalUrl} IS NOT NULL)::int
    + 2 * coalesce(${typologyCounts.count}, 0)
    + ${EQUIPMENTS}
  )`

  const rows = await db
    .select({
      id: accommodations.id,
      name: accommodations.name,
      slug: accommodations.slug,
      cityName: cities.name,
      descriptionLength: sql<number>`length(coalesce(${accommodations.description}, ''))`,
      imagesCount: sql<number>`coalesce(array_length(${accommodations.imagesUrls}, 1), 0)`,
      hasVirtualTour: sql<boolean>`(${accommodations.virtualTourUrl} IS NOT NULL AND ${accommodations.virtualTourUrl} <> '')`,
      equipmentsCount: sql<number>`${EQUIPMENTS}`,
      typologiesCount: sql<number>`coalesce(${typologyCounts.count}, 0)`,
      score,
    })
    .from(accommodations)
    .innerJoin(
      accommodationAddresses,
      and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
    )
    .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
    .leftJoin(typologyCounts, eq(typologyCounts.accommodationId, accommodations.id))
    .where(slug ? and(eq(accommodations.published, true), eq(accommodations.slug, slug)) : eq(accommodations.published, true))
    .orderBy(sql`${score} DESC`)
    .limit(10)

  if (rows.length === 0) {
    throw new Error(slug ? `Aucune résidence publiée avec le slug « ${slug} »` : 'Aucune résidence publiée en base')
  }

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    cityName: row.cityName,
    url: `/trouver-un-logement-etudiant/ville/${encodeURIComponent(row.cityName)}/${row.slug}`,
    score: Number(row.score),
    descriptionLength: Number(row.descriptionLength),
    imagesCount: Number(row.imagesCount),
    hasVirtualTour: Boolean(row.hasVirtualTour),
    equipmentsCount: Number(row.equipmentsCount),
    typologiesCount: Number(row.typologiesCount),
  }))
}
