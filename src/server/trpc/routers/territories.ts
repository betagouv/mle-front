import { TRPCError } from '@trpc/server'
import { type AnyColumn, and, asc, eq, ilike, inArray, ne, type SQL, sql } from 'drizzle-orm'
import { alias } from 'drizzle-orm/pg-core'
import fs from 'fs'
import path from 'path'
import { z } from 'zod'
import { db } from '~/server/db'
import { academies } from '~/server/db/schema/academies'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodationTypologies } from '~/server/db/schema/accommodation-typologies'
import { accommodations } from '~/server/db/schema/accommodations'
import { cities } from '~/server/db/schema/cities'
import { departments } from '~/server/db/schema/departments'
import { owners } from '~/server/db/schema/owners'
import { bboxSelect } from '~/server/trpc/utils/spatial-helpers'
import { normalizeCitySearch, tokenizeQuery } from '~/server/utils/normalize-city-search'
import { sortCitiesByRelevance } from '~/server/utils/sort-cities-by-relevance'
import { baseProcedure, createTRPCRouter } from '../init'

// Per-territory total of a typology, summed from the accommodation_typology child rows.
// Mirrors the SUM(accommodations.nbTotalApartments) semantics (a per-accommodation scalar
// summed over the address-joined rows), so multi-address behaviour is unchanged.
const cityTypeTotal = (type: string): SQL<number | null> =>
  sql<
    number | null
  >`SUM((SELECT COALESCE(SUM(t.nb_total), 0) FROM ${accommodationTypologies} t WHERE t.accommodation_id = ${accommodations.id} AND t.type = ${type}))::int`

let rentDataCache: Record<string, number> | null = null

function getRentData(): Record<string, number> {
  if (!rentDataCache) {
    const filePath = path.join(process.cwd(), 'public', 'loyers.json')
    const fileContents = fs.readFileSync(filePath, 'utf8')
    rentDataCache = JSON.parse(fileContents)
  }
  return rentDataCache!
}

function buildWhere(nameCol: AnyColumn, tokens: string[]): SQL {
  const conditions = tokens.map((token) => sql`immutable_unaccent(${nameCol}) ILIKE ${'%' + token + '%'}`)
  return and(...conditions)!
}

function buildRank(nameCol: AnyColumn, normalized: string): SQL {
  const normalizedCol = sql`LOWER(REPLACE(immutable_unaccent(${nameCol}), '-', ' '))`
  return sql`GREATEST(
    CASE WHEN ${normalizedCol} = ${normalized} THEN 2.0 ELSE 0.0 END,
    CASE WHEN ${normalizedCol} ILIKE ${normalized + '%'} THEN 1.0 ELSE 0.0 END,
    ts_rank(to_tsvector('simple', immutable_unaccent(${nameCol})), plainto_tsquery('simple', ${normalized}))
  ) DESC, ${nameCol} ASC`
}

type CityRow = {
  id: number
  name: string
  slug: string
  departmentCode: string | null
  postalCodes: string[] | null
  epciCode: string
  inseeCodes: string[] | null
  averageIncome: string | number | null
  averageRent: string | number | null
  popular: boolean
  nbStudents: number
  nbTotalApartments?: number | null
  nbCrousApartments?: number | null
  priceMin?: number | null
  bbox: { xmin: number; xmax: number; ymin: number; ymax: number }
}

type CityStats = {
  cityId?: number | null
  nbTotalApartments?: number | null
  priceMin?: number | null
  nbT1?: number | null
  nbT1Bis?: number | null
  nbT2?: number | null
  nbT3?: number | null
  nbT4?: number | null
  nbT5?: number | null
  nbT6?: number | null
  nbT7More?: number | null
}

function mapCityRow(c: CityRow, stats?: CityStats, nearbyCities: { name: string; slug: string }[] = []) {
  return {
    id: c.id,
    name: c.name,
    slug: c.slug,
    departmentCode: c.departmentCode ?? '',
    postalCodes: c.postalCodes ?? [],
    epciCode: c.epciCode ?? '',
    inseeCodes: c.inseeCodes ?? [],
    averageIncome: Number(c.averageIncome) || 0,
    averageRent: Number(c.averageRent) || 0,
    popular: c.popular,
    nbStudents: c.nbStudents ?? 0,
    nbTotalApartments: stats ? Number(stats.nbTotalApartments) || 0 : Number(c.nbTotalApartments) || 0,
    priceMin: stats?.priceMin != null ? Number(stats.priceMin) : c.priceMin != null ? Number(c.priceMin) : null,
    nbT1: stats?.nbT1 ?? null,
    nbT1Bis: stats?.nbT1Bis ?? null,
    nbT2: stats?.nbT2 ?? null,
    nbT3: stats?.nbT3 ?? null,
    nbT4: stats?.nbT4 ?? null,
    nbT5: stats?.nbT5 ?? null,
    nbT6: stats?.nbT6 ?? null,
    nbT7More: stats?.nbT7More ?? null,
    majorityCrous: (Number(c.nbCrousApartments) || 0) > (Number(c.nbTotalApartments) || 0) / 2,
    nearbyCities: nearbyCities,
    bbox: c.bbox,
  }
}

function cityAccommodationStatsSubquery(cityIdFilter?: SQL) {
  const conditions: SQL[] = [eq(accommodations.published, true)]
  if (cityIdFilter) conditions.push(cityIdFilter)

  return db
    .select({
      cityId: accommodationAddresses.cityId,
      nbTotalApartments: sql<number>`COALESCE(SUM(${accommodations.nbTotalApartments}), 0)::int`.as('nb_total_apartments'),
      priceMin: sql<number | null>`MIN(${accommodations.priceMin})`.as('price_min'),
      nbCrousApartments: sql<number>`
        COALESCE(
          SUM(
            CASE
              WHEN ${owners.name} = 'CROUS' THEN COALESCE(${accommodations.nbTotalApartments}, 0)
              ELSE 0
            END
          ),
          0
        )::int
      `.as('nb_crous_apartments'),
    })
    .from(accommodations)
    .innerJoin(accommodationAddresses, eq(accommodationAddresses.accommodationId, accommodations.id))
    .leftJoin(owners, eq(accommodations.ownerId, owners.id))
    .where(and(...conditions))
    .groupBy(accommodationAddresses.cityId)
    .as('city_accommodation_stats')
}

export const territoriesRouter = createTRPCRouter({
  search: baseProcedure.input(z.object({ q: z.string() })).query(async ({ input }) => {
    const { q } = input
    const empty = { academies: [], departments: [], cities: [] }
    const normalized = normalizeCitySearch(q)
    const tokens = tokenizeQuery(normalized)
    if (tokens.length === 0) return empty
    const matchingCityIds = db.select({ id: cities.id }).from(cities).where(buildWhere(cities.name, tokens))
    const cityStats = cityAccommodationStatsSubquery(inArray(accommodationAddresses.cityId, matchingCityIds))

    const [academyResults, departmentResults, cityResults] = await Promise.all([
      db
        .select({
          id: academies.id,
          name: academies.name,
          slug: academies.slug,
          bbox: bboxSelect(academies),
        })
        .from(academies)
        .where(buildWhere(academies.name, tokens))
        .orderBy(buildRank(academies.name, normalized))
        .limit(10),

      db
        .select({
          id: departments.id,
          name: departments.name,
          slug: departments.slug,
          bbox: bboxSelect(departments),
        })
        .from(departments)
        .where(buildWhere(departments.name, tokens))
        .orderBy(buildRank(departments.name, normalized))
        .limit(10),

      db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          departmentCode: departments.code,
          postalCodes: cities.postalCodes,
          epciCode: sql<string>`COALESCE(${cities.epciCode}, '')`,
          inseeCodes: cities.inseeCodes,
          averageIncome: cities.averageIncome,
          averageRent: cities.averageRent,
          popular: cities.popular,
          nbStudents: sql<number>`COALESCE(${cities.nbStudents}, 0)`,
          nbTotalApartments: cityStats.nbTotalApartments,
          priceMin: cityStats.priceMin,
          bbox: bboxSelect(cities),
        })
        .from(cities)
        .leftJoin(departments, eq(cities.departmentId, departments.id))
        .leftJoin(cityStats, eq(cityStats.cityId, cities.id))
        .where(buildWhere(cities.name, tokens))
        .orderBy(sql`(COALESCE(${cityStats.nbTotalApartments}, 0) > 0) DESC`, buildRank(cities.name, normalized))
        .limit(10),
    ])

    return {
      academies: academyResults.map((a) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        bbox: a.bbox,
      })),
      departments: departmentResults.map((d) => ({
        id: d.id,
        name: d.name,
        slug: d.slug,
        bbox: d.bbox,
      })),
      cities: cityResults.map((c) => mapCityRow(c)),
    }
  }),

  listAcademies: baseProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
    const results = await db
      .select({
        id: academies.id,
        name: academies.name,
        slug: academies.slug,
        bbox: bboxSelect(academies),
      })
      .from(academies)
      .where(input?.search ? ilike(academies.name, `%${input.search}%`) : undefined)
      .orderBy(asc(academies.name))

    return results.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      bbox: a.bbox,
    }))
  }),
  listDepartments: baseProcedure.input(z.object({ search: z.string().optional() }).optional()).query(async ({ input }) => {
    const conditions: SQL[] = [ne(departments.name, '')]
    if (input?.search) conditions.push(ilike(departments.name, `%${input.search}%`))
    const results = await db
      .select({
        id: departments.id,
        name: departments.name,
        slug: departments.slug,
        code: departments.code,
        bbox: bboxSelect(departments),
      })
      .from(departments)
      .where(and(...conditions))
      .orderBy(asc(departments.name))

    return results.map((d) => ({
      id: d.id,
      name: d.name,
      slug: d.slug,
      code: d.code,
      bbox: d.bbox,
    }))
  }),
  listCities: baseProcedure
    .input(
      z
        .object({
          departmentCode: z.string().optional(),
          popular: z.boolean().optional(),
          search: z.string().optional(),
        })
        .optional(),
    )
    .query(async ({ input }) => {
      const departmentCode = input?.departmentCode
      const popular = input?.popular

      let cityIdFilter: SQL | undefined
      if (departmentCode || popular) {
        const cityIdConditions: SQL[] = []
        if (departmentCode) cityIdConditions.push(eq(departments.code, departmentCode))
        if (popular) cityIdConditions.push(eq(cities.popular, true))
        const matchingCityIds = db
          .select({ id: cities.id })
          .from(cities)
          .leftJoin(departments, eq(cities.departmentId, departments.id))
          .where(and(...cityIdConditions))
        cityIdFilter = inArray(accommodationAddresses.cityId, matchingCityIds)
      }
      const cityStats = cityAccommodationStatsSubquery(cityIdFilter)

      const conditions: SQL[] = []
      if (departmentCode) conditions.push(eq(departments.code, departmentCode))
      if (popular) conditions.push(eq(cities.popular, true))
      if (input?.search) conditions.push(ilike(cities.name, `%${input.search}%`))

      const results = await db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          departmentCode: departments.code,
          postalCodes: cities.postalCodes,
          epciCode: sql<string>`COALESCE(${cities.epciCode}, '')`,
          inseeCodes: cities.inseeCodes,
          averageIncome: cities.averageIncome,
          averageRent: cities.averageRent,
          popular: cities.popular,
          nbStudents: sql<number>`COALESCE(${cities.nbStudents}, 0)`,
          nbTotalApartments: cityStats.nbTotalApartments,
          nbCrousApartments: cityStats.nbCrousApartments,
          priceMin: cityStats.priceMin,
          bbox: bboxSelect(cities),
        })
        .from(cities)
        .leftJoin(departments, eq(cities.departmentId, departments.id))
        .leftJoin(cityStats, eq(cityStats.cityId, cities.id))
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(asc(cities.name))

      return results.map((c) => mapCityRow(c))
    }),

  getCityDetails: baseProcedure.input(z.object({ slug: z.string() })).query(async ({ input }) => {
    const { slug } = input
    const slugLower = slug.toLowerCase()

    const c1 = alias(cities, 'c1')
    const c2 = alias(cities, 'c2')

    const [cityRows, accommodationStats, nearbyCities] = await Promise.all([
      db
        .select({
          id: cities.id,
          name: cities.name,
          slug: cities.slug,
          departmentCode: departments.code,
          postalCodes: cities.postalCodes,
          epciCode: sql<string>`COALESCE(${cities.epciCode}, '')`,
          inseeCodes: cities.inseeCodes,
          averageIncome: cities.averageIncome,
          averageRent: cities.averageRent,
          popular: cities.popular,
          nbStudents: sql<number>`COALESCE(${cities.nbStudents}, 0)`,
          bbox: bboxSelect(cities),
        })
        .from(cities)
        .leftJoin(departments, eq(cities.departmentId, departments.id))
        .where(eq(cities.slug, slugLower))
        .limit(1),

      db
        .select({
          nbTotalApartments: sql<number>`COALESCE(SUM(${accommodations.nbTotalApartments}), 0)::int`,
          priceMin: sql<number | null>`MIN(${accommodations.priceMin})`,
          nbT1: cityTypeTotal('t1'),
          nbT1Bis: cityTypeTotal('t1_bis'),
          nbT2: cityTypeTotal('t2'),
          nbT3: cityTypeTotal('t3'),
          nbT4: cityTypeTotal('t4'),
          nbT5: cityTypeTotal('t5'),
          nbT6: cityTypeTotal('t6'),
          nbT7More: cityTypeTotal('t7_more'),
        })
        .from(accommodations)
        .innerJoin(accommodationAddresses, eq(accommodationAddresses.accommodationId, accommodations.id))
        .where(
          and(
            sql`${accommodationAddresses.cityId} = (SELECT ${cities.id} FROM ${cities} WHERE ${cities.slug} = ${slugLower} LIMIT 1)`,
            eq(accommodations.published, true),
          ),
        ),

      db
        .select({ name: c2.name, slug: c2.slug })
        .from(c1)
        .innerJoin(c2, and(ne(c1.id, c2.id), sql`ST_DWithin(${c1.boundary}::geography, ${c2.boundary}::geography, 50000)`))
        .where(eq(c1.slug, slugLower))
        .orderBy(asc(c2.name)),
    ])

    const city = cityRows[0]
    if (!city) {
      throw new Error(`City not found: ${slug}`)
    }

    return mapCityRow(
      city,
      accommodationStats[0] ?? undefined,
      nearbyCities.map((nc) => ({ name: nc.name, slug: nc.slug })),
    )
  }),

  getBySlug: baseProcedure
    .input(z.object({ type: z.enum(['ville', 'academie', 'departement']), slug: z.string() }))
    .query(async ({ input }) => {
      const slugLower = input.slug.toLowerCase()

      if (input.type === 'ville') {
        const [cityRows, accommodationStats] = await Promise.all([
          db
            .select({
              id: cities.id,
              name: cities.name,
              slug: cities.slug,
              departmentCode: departments.code,
              postalCodes: cities.postalCodes,
              epciCode: sql<string>`COALESCE(${cities.epciCode}, '')`,
              inseeCodes: cities.inseeCodes,
              averageIncome: cities.averageIncome,
              averageRent: cities.averageRent,
              popular: cities.popular,
              nbStudents: sql<number>`COALESCE(${cities.nbStudents}, 0)`,
              bbox: bboxSelect(cities),
            })
            .from(cities)
            .leftJoin(departments, eq(cities.departmentId, departments.id))
            .where(eq(cities.slug, slugLower))
            .limit(1),

          db
            .select({
              nbTotalApartments: sql<number>`COALESCE(SUM(${accommodations.nbTotalApartments}), 0)::int`,
              priceMin: sql<number | null>`MIN(${accommodations.priceMin})`,
              nbT1: cityTypeTotal('t1'),
              nbT1Bis: cityTypeTotal('t1_bis'),
              nbT2: cityTypeTotal('t2'),
              nbT3: cityTypeTotal('t3'),
              nbT4: cityTypeTotal('t4'),
              nbT5: cityTypeTotal('t5'),
              nbT6: cityTypeTotal('t6'),
              nbT7More: cityTypeTotal('t7_more'),
            })
            .from(accommodations)
            .innerJoin(accommodationAddresses, eq(accommodationAddresses.accommodationId, accommodations.id))
            .where(
              and(
                sql`${accommodationAddresses.cityId} = (SELECT ${cities.id} FROM ${cities} WHERE ${cities.slug} = ${slugLower} LIMIT 1)`,
                eq(accommodations.published, true),
              ),
            ),
        ])

        const city = cityRows[0]
        if (!city) throw new TRPCError({ code: 'NOT_FOUND', message: `City not found: ${input.slug}` })

        return mapCityRow(city, accommodationStats[0] ?? undefined)
      }

      if (input.type === 'academie') {
        const rows = await db
          .select({ id: academies.id, name: academies.name, slug: academies.slug, bbox: bboxSelect(academies) })
          .from(academies)
          .where(eq(academies.slug, slugLower))
          .limit(1)

        if (!rows[0]) throw new TRPCError({ code: 'NOT_FOUND', message: `Academy not found: ${input.slug}` })
        return rows[0]
      }

      // departement
      const rows = await db
        .select({ id: departments.id, name: departments.name, slug: departments.slug, bbox: bboxSelect(departments) })
        .from(departments)
        .where(eq(departments.slug, slugLower))
        .limit(1)

      if (!rows[0]) throw new TRPCError({ code: 'NOT_FOUND', message: `Department not found: ${input.slug}` })
      return rows[0]
    }),

  rentSearch: baseProcedure.input(z.object({ q: z.string().min(1) })).query(({ input }) => {
    const rentData = getRentData()
    const searchTerm = input.q.toLowerCase()

    const filteredCities = sortCitiesByRelevance(
      Object.entries(rentData)
        .filter(([city]) => city.toLowerCase().includes(searchTerm))
        .map(([city, rentPerM2]) => ({
          city,
          rentPerM2,
          rentFor20M2: rentPerM2 * 20,
        })),
      searchTerm,
    )

    return {
      cities: filteredCities,
      total: filteredCities.length,
    }
  }),
})
