import { TRPCError } from '@trpc/server'
import { and, eq, notInArray, type SQL, sql } from 'drizzle-orm'
import { z } from 'zod'
import { EXPANDED_SEARCH_PAGE_SIZE, EXPANDED_SEARCH_RADIUS_KM } from '~/lib/accommodations-expanded-search'
import {
  applyCenterRadiusFilter,
  applyCommonListFilters,
  crousExistsCondition,
  listAccommodationsWithConditions,
  toResidenceType,
  toTargetAudience,
} from '~/server/accommodations/list-query'
import { db } from '~/server/db'
import { academies } from '~/server/db/schema/academies'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodations } from '~/server/db/schema/accommodations'
import { cities } from '~/server/db/schema/cities'
import { departments } from '~/server/db/schema/departments'
import { owners } from '~/server/db/schema/owners'
import { baseProcedure, createTRPCRouter } from '../init'
import { bboxSelect } from '../utils/spatial-helpers'

// Les query builders vivent désormais dans `~/server/accommodations/list-query` (partagés avec l'API
// publique REST v1). On ré-exporte les deux symboles encore importés directement depuis ce module par
// d'autres routers (favorites, bailleur) et par `get-my-accommodations`.
export { mapToGeoJsonFeature, priceMaxComputed } from '~/server/accommodations/list-query'

export const accommodationsRouter = createTRPCRouter({
  list: baseProcedure
    .input(
      z.object({
        bbox: z.string().optional(),
        center: z.string().optional(), // "lng,lat"
        radius: z.number().default(10), // km
        page: z.number().default(1),
        pageSize: z.number().default(12),
        isAccessible: z.boolean().optional(),
        hasColiving: z.boolean().optional(),
        onlyWithAvailability: z.boolean().optional(),
        priceMax: z.number().optional(),
        viewCrous: z.boolean().default(false),
        academyId: z.number().optional(),
        ownerSlug: z.string().optional(),
        cityId: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { bbox, center, radius, page, pageSize, academyId } = input

      const conditions: SQL[] = [eq(accommodations.published, true), sql`${accommodationAddresses.geom} IS NOT NULL`]
      // On applique tous les filtres SAUF crous : les conditions résultantes servent à compter les deux buckets,
      // puis on ajoute le filtre crous par-dessus pour les résultats paginés.
      await applyCommonListFilters(conditions, { ...input, skipCrous: true })

      let addressOrderHint: SQL | undefined
      if (input.cityId) {
        conditions.push(
          sql`ST_Within(${accommodationAddresses.geom}, (SELECT ${cities.boundary} FROM ${cities} WHERE ${cities.id} = ${input.cityId}))`,
        )
        // Prefer the address in the searched city
        addressOrderHint = sql`CASE WHEN ${accommodationAddresses.cityId} = ${input.cityId} THEN 0 ELSE 1 END, ${accommodationAddresses.isMain} DESC`
      } else if (academyId) {
        conditions.push(
          sql`ST_Within(${accommodationAddresses.geom}, (SELECT ${academies.boundary} FROM ${academies} WHERE ${academies.id} = ${academyId}))`,
        )
      } else if (bbox) {
        const parts = bbox.split(',').map(Number)
        if (parts.length === 4) {
          const [xmin, ymin, xmax, ymax] = parts
          conditions.push(sql`ST_Intersects(${accommodationAddresses.geom}, ST_MakeEnvelope(${xmin}, ${ymin}, ${xmax}, ${ymax}, 4326))`)
        }
      } else if (center) {
        applyCenterRadiusFilter(conditions, center, radius)
      }

      const whereWithoutCrous = and(...conditions)
      const where = and(whereWithoutCrous, input.viewCrous ? crousExistsCondition : sql`NOT (${crousExistsCondition})`)
      return listAccommodationsWithConditions({ page, pageSize, where, whereWithoutCrous, addressOrderHint })
    }),

  listExpandedByCity: baseProcedure
    .input(
      z.object({
        city: z.string().min(1),
        radius: z.number().default(EXPANDED_SEARCH_RADIUS_KM),
        page: z.number().default(1),
        pageSize: z.number().default(EXPANDED_SEARCH_PAGE_SIZE),
        isAccessible: z.boolean().optional(),
        hasColiving: z.boolean().optional(),
        onlyWithAvailability: z.boolean().optional(),
        priceMax: z.number().optional(),
        viewCrous: z.boolean().default(false),
        ownerSlug: z.string().optional(),
        excludeIds: z.array(z.number()).optional(),
      }),
    )
    .query(async ({ input }) => {
      const citySlug = input.city.trim().toLowerCase()
      const citySelect = {
        id: cities.id,
        centerLat: sql<number>`ST_Y(ST_Centroid(${cities.boundary})::geometry)`,
        centerLng: sql<number>`ST_X(ST_Centroid(${cities.boundary})::geometry)`,
      }

      // Fast path: lookup by slug (unique index)
      let [cityRow] = await db
        .select(citySelect)
        .from(cities)
        .where(sql`${cities.boundary} IS NOT NULL AND ${cities.slug} = ${citySlug}`)
        .limit(1)

      // Fallback: lookup by normalized name
      if (!cityRow) {
        ;[cityRow] = await db
          .select(citySelect)
          .from(cities)
          .where(
            sql`${cities.boundary} IS NOT NULL AND LOWER(immutable_unaccent(${cities.name})) = LOWER(immutable_unaccent(${input.city.trim()}))`,
          )
          .limit(1)
      }

      if (!cityRow) {
        return {
          count: 0,
          page_size: input.pageSize,
          min_price: null,
          max_price: null,
          next: null,
          previous: null,
          results: { features: [] },
        }
      }

      const { page, pageSize, radius } = input
      const center = `${cityRow.centerLng},${cityRow.centerLat}`

      const conditions: SQL[] = [eq(accommodations.published, true), sql`${accommodationAddresses.geom} IS NOT NULL`]
      await applyCommonListFilters(conditions, input)
      applyCenterRadiusFilter(conditions, center, radius)
      // Exclude accommodations inside the city boundary so only surrounding results appear
      conditions.push(
        sql`NOT ST_Within(${accommodationAddresses.geom}, (SELECT ${cities.boundary} FROM ${cities} WHERE ${cities.id} = ${cityRow.id}))`,
      )
      if (input.excludeIds?.length) {
        conditions.push(notInArray(accommodations.id, input.excludeIds))
      }

      const where = and(...conditions)
      return listAccommodationsWithConditions({ page, pageSize, where })
    }),

  getBySlug: baseProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    // Get the accommodation with its main address
    const rows = await db
      .select({
        id: accommodations.id,
        name: accommodations.name,
        slug: accommodations.slug,
        description: accommodations.description,
        rentalChargesDetails: accommodations.rentalChargesDetails,
        address: accommodationAddresses.address,
        city: cities.name,
        postalCode: accommodationAddresses.postalCode,
        residenceType: accommodations.residenceType,
        targetAudience: accommodations.target_audience,
        published: accommodations.published,
        nbTotalApartments: accommodations.nbTotalApartments,
        nbAccessibleApartments: accommodations.nbAccessibleApartments,
        nbColivingApartments: accommodations.nbColivingApartments,
        nbT1: accommodations.nbT1,
        nbT1Bis: accommodations.nbT1Bis,
        nbT2: accommodations.nbT2,
        nbT3: accommodations.nbT3,
        nbT4: accommodations.nbT4,
        nbT5: accommodations.nbT5,
        nbT6: accommodations.nbT6,
        nbT7More: accommodations.nbT7More,
        nbT1Available: accommodations.nbT1Available,
        nbT1BisAvailable: accommodations.nbT1BisAvailable,
        nbT2Available: accommodations.nbT2Available,
        nbT3Available: accommodations.nbT3Available,
        nbT4Available: accommodations.nbT4Available,
        nbT5Available: accommodations.nbT5Available,
        nbT6Available: accommodations.nbT6Available,
        nbT7MoreAvailable: accommodations.nbT7MoreAvailable,
        priceMin: accommodations.priceMin,
        priceMinT1: accommodations.priceMinT1,
        priceMaxT1: accommodations.priceMaxT1,
        priceMinT1Bis: accommodations.priceMinT1Bis,
        priceMaxT1Bis: accommodations.priceMaxT1Bis,
        priceMinT2: accommodations.priceMinT2,
        priceMaxT2: accommodations.priceMaxT2,
        priceMinT3: accommodations.priceMinT3,
        priceMaxT3: accommodations.priceMaxT3,
        priceMinT4: accommodations.priceMinT4,
        priceMaxT4: accommodations.priceMaxT4,
        priceMinT5: accommodations.priceMinT5,
        priceMaxT5: accommodations.priceMaxT5,
        priceMinT6: accommodations.priceMinT6,
        priceMaxT6: accommodations.priceMaxT6,
        priceMinT7More: accommodations.priceMinT7More,
        priceMaxT7More: accommodations.priceMaxT7More,
        superficieMinT1: accommodations.superficieMinT1,
        superficieMaxT1: accommodations.superficieMaxT1,
        superficieMinT1Bis: accommodations.superficieMinT1Bis,
        superficieMaxT1Bis: accommodations.superficieMaxT1Bis,
        superficieMinT2: accommodations.superficieMinT2,
        superficieMaxT2: accommodations.superficieMaxT2,
        superficieMinT3: accommodations.superficieMinT3,
        superficieMaxT3: accommodations.superficieMaxT3,
        superficieMinT4: accommodations.superficieMinT4,
        superficieMaxT4: accommodations.superficieMaxT4,
        superficieMinT5: accommodations.superficieMinT5,
        superficieMaxT5: accommodations.superficieMaxT5,
        superficieMinT6: accommodations.superficieMinT6,
        superficieMaxT6: accommodations.superficieMaxT6,
        superficieMinT7More: accommodations.superficieMinT7More,
        superficieMaxT7More: accommodations.superficieMaxT7More,
        acceptWaitingList: accommodations.acceptWaitingList,
        scholarshipHoldersPriority: accommodations.scholarshipHoldersPriority,
        socialHousingRequired: accommodations.socialHousingRequired,
        wifi: accommodations.wifi,
        imagesUrls: accommodations.imagesUrls,
        externalUrl: accommodations.externalUrl,
        virtualTourUrl: accommodations.virtualTourUrl,
        updatedAt: accommodations.updatedAt,
        laundryRoom: accommodations.laundryRoom,
        commonAreas: accommodations.commonAreas,
        bikeStorage: accommodations.bikeStorage,
        parking: accommodations.parking,
        secureAccess: accommodations.secureAccess,
        residenceManager: accommodations.residenceManager,
        kitchenType: accommodations.kitchenType,
        desk: accommodations.desk,
        cookingPlates: accommodations.cookingPlates,
        microwave: accommodations.microwave,
        refrigerator: accommodations.refrigerator,
        bathroom: accommodations.bathroom,
        lat: sql<number>`ST_Y(${accommodationAddresses.geom}::geometry)`,
        lng: sql<number>`ST_X(${accommodationAddresses.geom}::geometry)`,
        ownerName: owners.name,
        ownerSlug: owners.slug,
        ownerUrl: owners.url,
        ownerLandingUrl: owners.landingUrl,
        ownerImage: owners.image,
        ownerAcceptDossierFacile: owners.acceptDossierFacileApplications,
        citySlug: cities.slug,
        cityBbox: bboxSelect(cities),
        departmentCode: departments.code,
      })
      .from(accommodations)
      .innerJoin(
        accommodationAddresses,
        and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
      )
      .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
      .innerJoin(departments, eq(cities.departmentId, departments.id))
      .leftJoin(owners, eq(accommodations.ownerId, owners.id))
      .where(and(eq(accommodations.slug, input.slug), eq(accommodations.published, true), sql`${accommodationAddresses.geom} IS NOT NULL`))
      .limit(1)

    const row = rows[0]
    if (!row) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `[accommodations.getBySlug] Accommodation not found: ${input.slug}` })
    }

    const allAddresses = await db
      .select({
        address: accommodationAddresses.address,
        postalCode: accommodationAddresses.postalCode,
        cityName: cities.name,
        isMain: accommodationAddresses.isMain,
        lat: sql<number | null>`ST_Y(${accommodationAddresses.geom}::geometry)`,
        lng: sql<number | null>`ST_X(${accommodationAddresses.geom}::geometry)`,
      })
      .from(accommodationAddresses)
      .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
      .where(eq(accommodationAddresses.accommodationId, row.id))
      .orderBy(sql`${accommodationAddresses.isMain} DESC`)

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      description: row.description ?? null,
      rental_charges_details: row.rentalChargesDetails ?? null,
      address: row.address ?? '',
      city: row.city,
      postal_code: row.postalCode,
      addresses: allAddresses.map((a) => ({
        address: a.address ?? '',
        city: a.cityName,
        postal_code: a.postalCode,
        is_main: a.isMain,
        latitude: a.lat,
        longitude: a.lng,
      })),
      residence_type: toResidenceType(row.residenceType),
      target_audience: toTargetAudience(row.targetAudience),
      published: row.published,
      accept_waiting_list: row.acceptWaitingList ?? false,
      images_urls: row.imagesUrls ?? null,
      external_url: row.externalUrl ?? undefined,
      virtual_tour_url: row.virtualTourUrl ?? null,
      updated_at: row.updatedAt ?? new Date(),
      scholarship_holders_priority: row.scholarshipHoldersPriority ?? false,
      social_housing_required: row.socialHousingRequired ?? false,
      wifi: row.wifi ?? false,
      nb_total_apartments: row.nbTotalApartments,
      nb_accessible_apartments: row.nbAccessibleApartments,
      nb_coliving_apartments: row.nbColivingApartments,
      nb_t1: row.nbT1,
      nb_t1_bis: row.nbT1Bis,
      nb_t2: row.nbT2,
      nb_t3: row.nbT3,
      nb_t4: row.nbT4,
      nb_t5: row.nbT5,
      nb_t6: row.nbT6,
      nb_t7_more: row.nbT7More,
      nb_t1_available: row.nbT1Available,
      nb_t1_bis_available: row.nbT1BisAvailable,
      nb_t2_available: row.nbT2Available,
      nb_t3_available: row.nbT3Available,
      nb_t4_available: row.nbT4Available,
      nb_t5_available: row.nbT5Available,
      nb_t6_available: row.nbT6Available,
      nb_t7_more_available: row.nbT7MoreAvailable,
      price_min: row.priceMin,
      price_min_t1: row.priceMinT1,
      price_min_t1_bis: row.priceMinT1Bis,
      price_min_t2: row.priceMinT2,
      price_min_t3: row.priceMinT3,
      price_min_t4: row.priceMinT4,
      price_min_t5: row.priceMinT5,
      price_min_t6: row.priceMinT6,
      price_min_t7_more: row.priceMinT7More,
      price_max: (() => {
        const maxes = [
          row.priceMaxT1,
          row.priceMaxT1Bis,
          row.priceMaxT2,
          row.priceMaxT3,
          row.priceMaxT4,
          row.priceMaxT5,
          row.priceMaxT6,
          row.priceMaxT7More,
        ].filter((v): v is number => v != null && v > 0)
        return maxes.length > 0 ? Math.max(...maxes) : null
      })(),
      price_max_t1: row.priceMaxT1,
      price_max_t1_bis: row.priceMaxT1Bis,
      price_max_t2: row.priceMaxT2,
      price_max_t3: row.priceMaxT3,
      price_max_t4: row.priceMaxT4,
      price_max_t5: row.priceMaxT5,
      price_max_t6: row.priceMaxT6,
      price_max_t7_more: row.priceMaxT7More,
      superficie_min_t1: row.superficieMinT1,
      superficie_max_t1: row.superficieMaxT1,
      superficie_min_t1_bis: row.superficieMinT1Bis,
      superficie_max_t1_bis: row.superficieMaxT1Bis,
      superficie_min_t2: row.superficieMinT2,
      superficie_max_t2: row.superficieMaxT2,
      superficie_min_t3: row.superficieMinT3,
      superficie_max_t3: row.superficieMaxT3,
      superficie_min_t4: row.superficieMinT4,
      superficie_max_t4: row.superficieMaxT4,
      superficie_min_t5: row.superficieMinT5,
      superficie_max_t5: row.superficieMaxT5,
      superficie_min_t6: row.superficieMinT6,
      superficie_max_t6: row.superficieMaxT6,
      superficie_min_t7_more: row.superficieMinT7More,
      superficie_max_t7_more: row.superficieMaxT7More,
      refrigerator: row.refrigerator,
      laundry_room: row.laundryRoom,
      bathroom: row.bathroom as 'private' | 'shared' | null,
      kitchen_type: row.kitchenType as 'private' | 'shared' | null,
      microwave: row.microwave,
      secure_access: row.secureAccess,
      parking: row.parking,
      common_areas: row.commonAreas,
      bike_storage: row.bikeStorage,
      desk: row.desk,
      residence_manager: row.residenceManager,
      cooking_plates: row.cookingPlates,
      geom: {
        type: 'Point' as const,
        coordinates: [row.lng, row.lat],
      },
      owner: row.ownerName
        ? {
            name: row.ownerName,
            slug: row.ownerSlug ?? '',
            url: row.ownerUrl ?? '',
            landing_url: row.ownerLandingUrl ?? null,
            image_base64: row.ownerImage ? `data:image/jpeg;base64,${Buffer.from(row.ownerImage).toString('base64')}` : null,
            accept_dossier_facile_applications: row.ownerAcceptDossierFacile ?? false,
          }
        : null,
      city_slug: row.citySlug,
      city_bbox: row.cityBbox,
      department_code: row.departmentCode,
    }
  }),
})
