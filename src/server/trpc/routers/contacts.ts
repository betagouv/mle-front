import { TRPCError } from '@trpc/server'
import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { APARTMENT_TYPES } from '~/enums/apartment-type'
import { db } from '~/server/db'
import { accommodations, contactRequests, owners } from '~/server/db/schema'
import { createTRPCRouter, userProcedure } from '../init'

export const contactsRouter = createTRPCRouter({
  /** Le student courant a-t-il déjà laissé ses coordonnées sur cette résidence ? */
  myRequest: userProcedure.input(z.object({ accommodationSlug: z.string() })).query(async ({ ctx, input }) => {
    const request = await db.query.contactRequests.findFirst({
      where: and(eq(contactRequests.userId, ctx.session.user.id), eq(contactRequests.accommodationSlug, input.accommodationSlug)),
    })
    return request ?? null
  }),

  /** Laisser ses coordonnées (mode `contacts` du gestionnaire). */
  create: userProcedure
    .input(
      z.object({
        accommodationSlug: z.string(),
        apartmentType: z.enum(APARTMENT_TYPES).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [accommodation] = await db
        .select({ ownerId: accommodations.ownerId })
        .from(accommodations)
        .where(eq(accommodations.slug, input.accommodationSlug))
        .limit(1)

      if (!accommodation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found' })
      }

      const owner = accommodation.ownerId
        ? await db.query.owners.findFirst({ where: eq(owners.id, accommodation.ownerId), columns: { contactMode: true } })
        : null

      if (owner?.contactMode !== 'contacts') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: "Ce gestionnaire n'accepte pas les demandes de contact" })
      }

      const [request] = await db
        .insert(contactRequests)
        .values({
          userId: ctx.session.user.id,
          accommodationSlug: input.accommodationSlug,
          apartmentType: input.apartmentType ?? null,
        })
        .onConflictDoNothing()
        .returning()

      return request ?? null
    }),
})
