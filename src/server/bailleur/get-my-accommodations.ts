import { and, desc, eq, ilike, sql } from 'drizzle-orm'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'
import { getOwnerForUser } from '~/server/bailleur/get-owner-for-user'
import { db } from '~/server/db'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodations } from '~/server/db/schema/accommodations'
import { cities } from '~/server/db/schema/cities'
import { owners } from '~/server/db/schema/owners'
import { priceMaxComputed, rowsToAccommodationDTOs } from '~/server/trpc/routers/accommodations'
import { getQueryClient } from '~/server/trpc/server'
import { getServerSession } from '~/services/better-auth'

const PAGE_SIZE = 20

export const myAccommodationsQueryKey = (
  page?: string | null,
  disponible?: string | null,
  recherche?: string | null,
  ownerId?: string | null,
) => ['my-accommodations', page ? Number(page) : null, disponible === 'true' ? true : null, recherche || null, ownerId || null] as const

export const getMyAccommodations = async (searchParams?: {
  page?: string
  disponible?: string
  recherche?: string
  ownerId?: string
}): Promise<TGetAccomodationsResponse> => {
  const auth = await getServerSession()

  if (!auth) {
    throw new Error('Unauthorized')
  }

  const ownerId = searchParams?.ownerId ? Number(searchParams.ownerId) : undefined
  const owner = await getOwnerForUser(auth.user.id, ownerId)

  if (!owner) {
    return {
      count: 0,
      pageSize: PAGE_SIZE,
      next: null,
      previous: null,
      minPrice: null,
      maxPrice: null,
      results: [],
    }
  }

  const page = searchParams?.page ? Number(searchParams.page) : 1
  const search = searchParams?.recherche

  const conditions = [eq(accommodations.ownerId, owner.id)]

  if (search && search.length >= 3) {
    conditions.push(ilike(accommodations.name, `%${search}%`))
  }

  const where = and(...conditions)
  const offset = (page - 1) * PAGE_SIZE

  const [countResult, priceBounds, results] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(accommodations).where(where),
    db
      .select({
        minPrice: sql<number | null>`MIN(${accommodations.priceMin})`,
        maxPrice: sql<number | null>`MAX(${priceMaxComputed})`,
      })
      .from(accommodations)
      .where(where),
    db
      .select({
        id: accommodations.id,
        name: accommodations.name,
        slug: accommodations.slug,
        description: accommodations.description,
        address: accommodationAddresses.address,
        city: cities.name,
        citySlug: cities.slug,
        postalCode: accommodationAddresses.postalCode,
        residenceType: accommodations.residenceType,
        targetAudience: accommodations.targetAudience,
        published: accommodations.published,
        nbTotalApartments: accommodations.nbTotalApartments,
        nbAccessibleApartments: accommodations.nbAccessibleApartments,
        nbColivingApartments: accommodations.nbColivingApartments,
        priceMin: accommodations.priceMin,
        priceMaxComputed: priceMaxComputed,
        acceptWaitingList: accommodations.acceptWaitingList,
        scholarshipHoldersPriority: accommodations.scholarshipHoldersPriority,
        socialHousingRequired: accommodations.socialHousingRequired,
        wifi: accommodations.wifi,
        imagesUrls: accommodations.imagesUrls,
        externalUrl: accommodations.externalUrl,
        virtualTourUrl: accommodations.virtualTourUrl,
        updatedAt: accommodations.updatedAt,
        ownerName: owners.name,
        ownerUrl: owners.url,
        lat: sql<number>`ST_Y(${accommodationAddresses.geom}::geometry)`,
        lng: sql<number>`ST_X(${accommodationAddresses.geom}::geometry)`,
      })
      .from(accommodations)
      .innerJoin(
        accommodationAddresses,
        and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
      )
      .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
      .leftJoin(owners, eq(accommodations.ownerId, owners.id))
      .where(where)
      .orderBy(desc(accommodations.published), accommodations.name)
      .limit(PAGE_SIZE)
      .offset(offset),
  ])

  const count = countResult[0]?.count ?? 0
  const totalPages = Math.ceil(count / PAGE_SIZE)

  return {
    count,
    pageSize: PAGE_SIZE,
    next: page < totalPages ? String(page + 1) : null,
    previous: page > 1 ? String(page - 1) : null,
    minPrice: priceBounds[0]?.minPrice != null ? Number(priceBounds[0].minPrice) : null,
    maxPrice: priceBounds[0]?.maxPrice != null ? Number(priceBounds[0].maxPrice) : null,
    results: await rowsToAccommodationDTOs(results),
  }
}

export const prefetchMyAccommodations = async (searchParams?: {
  page?: string
  disponible?: string
  recherche?: string
  ownerId?: string
}) => {
  const queryClient = getQueryClient()

  await queryClient.prefetchQuery({
    queryKey: myAccommodationsQueryKey(searchParams?.page, searchParams?.disponible, searchParams?.recherche, searchParams?.ownerId),
    queryFn: () => getMyAccommodations(searchParams),
  })

  return queryClient
}
