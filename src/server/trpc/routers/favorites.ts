import { TRPCError } from '@trpc/server'
import { and, desc, eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '~/server/db'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodationTypologies } from '~/server/db/schema/accommodation-typologies'
import { accommodations } from '~/server/db/schema/accommodations'
import { alertJobs } from '~/server/db/schema/alert-jobs'
import { cities } from '~/server/db/schema/cities'
import { favoriteAccommodations } from '~/server/db/schema/favorite-accommodations'
import { owners } from '~/server/db/schema/owners'
import { typologiesByType } from '~/server/lib/typologies'
import { createTRPCRouter, userProcedure } from '../init'
import { priceMaxComputed, toAccommodationDTO } from './accommodations'

export const favoritesRouter = createTRPCRouter({
  list: userProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id

    const results = await db
      .select({
        id: favoriteAccommodations.id,
        createdAt: favoriteAccommodations.createdAt,
        accommodationId: accommodations.id,
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
      .from(favoriteAccommodations)
      .innerJoin(accommodations, eq(favoriteAccommodations.accommodationId, accommodations.id))
      .innerJoin(
        accommodationAddresses,
        and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
      )
      .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
      .leftJoin(owners, eq(accommodations.ownerId, owners.id))
      .where(and(eq(favoriteAccommodations.userId, userId), eq(accommodations.published, true)))
      .orderBy(desc(favoriteAccommodations.createdAt))

    const accIds = results.map((r) => r.accommodationId)
    const typologyRows =
      accIds.length > 0
        ? await db.select().from(accommodationTypologies).where(inArray(accommodationTypologies.accommodationId, accIds))
        : []
    const typologiesByAccommodation = new Map<number, (typeof typologyRows)[number][]>()
    for (const tRow of typologyRows) {
      const list = typologiesByAccommodation.get(tRow.accommodationId) ?? []
      list.push(tRow)
      typologiesByAccommodation.set(tRow.accommodationId, list)
    }

    return results.map((row) => ({
      id: row.id,
      accommodation: toAccommodationDTO(
        { ...row, id: row.accommodationId },
        typologiesByType(typologiesByAccommodation.get(row.accommodationId) ?? []),
      ),
      created_at: row.createdAt,
    }))
  }),

  add: userProcedure.input(z.object({ accommodationSlug: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    const accom = await db.query.accommodations.findFirst({
      where: eq(accommodations.slug, input.accommodationSlug),
      columns: { id: true },
    })

    if (!accom) {
      throw new TRPCError({ code: 'NOT_FOUND', message: `[favorites.add] Accommodation not found: ${input.accommodationSlug}` })
    }

    const [row] = await db
      .insert(favoriteAccommodations)
      .values({
        userId,
        accommodationId: accom.id,
      })
      .onConflictDoNothing()
      .returning()

    if (!row) {
      const existing = await db.query.favoriteAccommodations.findFirst({
        where: and(eq(favoriteAccommodations.userId, userId), eq(favoriteAccommodations.accommodationId, accom.id)),
      })
      return existing!
    }

    return row
  }),

  remove: userProcedure.input(z.object({ slug: z.string() })).mutation(async ({ ctx, input }) => {
    const userId = ctx.session.user.id

    const accom = await db.query.accommodations.findFirst({
      where: eq(accommodations.slug, input.slug),
      columns: { id: true },
    })

    if (!accom) return { success: true }

    await db
      .delete(favoriteAccommodations)
      .where(and(eq(favoriteAccommodations.userId, userId), eq(favoriteAccommodations.accommodationId, accom.id)))

    // Annuler les jobs pending issus de ce favori pour éviter un email post-suppression.
    await db
      .delete(alertJobs)
      .where(
        and(
          eq(alertJobs.userId, userId),
          eq(alertJobs.accommodationId, accom.id),
          eq(alertJobs.source, 'favorite'),
          eq(alertJobs.status, 'pending'),
        ),
      )

    return { success: true }
  }),
})
