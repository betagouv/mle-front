import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { ZUpdateStudentProfileInput } from '~/schemas/student/update-profile'
import { db } from '~/server/db'
import { user } from '~/server/db/schema/auth'
import { createTRPCRouter, userProcedure } from '../init'

export const studentRouter = createTRPCRouter({
  getProfile: userProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        phone: user.phone,
        birthdate: user.birthdate,
        scholarshipStatus: user.scholarshipStatus,
        notifSimilarAlert: user.notifSimilarAlert,
        notifFavoriteAlert: user.notifFavoriteAlert,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))

    return (
      row ?? {
        firstname: '',
        lastname: '',
        email: ctx.session.user.email,
        phone: null,
        birthdate: null,
        scholarshipStatus: null,
        notifSimilarAlert: true,
        notifFavoriteAlert: true,
      }
    )
  }),

  updateProfile: userProcedure.input(ZUpdateStudentProfileInput).mutation(async ({ ctx, input }) => {
    await db
      .update(user)
      .set({
        firstname: input.firstname,
        lastname: input.lastname,
        name: `${input.firstname} ${input.lastname}`,
        phone: input.phone ?? null,
        birthdate: input.birthdate ?? null,
        scholarshipStatus: input.scholarshipStatus ?? null,
        updatedAt: new Date(),
      })
      .where(eq(user.id, ctx.session.user.id))

    return { success: true }
  }),

  getNotificationPreferences: userProcedure.query(async ({ ctx }) => {
    const [row] = await db
      .select({ notifSimilarAlert: user.notifSimilarAlert, notifFavoriteAlert: user.notifFavoriteAlert })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))

    return row ?? { notifSimilarAlert: true, notifFavoriteAlert: true }
  }),

  updateNotificationPreferences: userProcedure
    .input(z.object({ notifSimilarAlert: z.boolean().optional(), notifFavoriteAlert: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<{ notifSimilarAlert: boolean; notifFavoriteAlert: boolean }> = {}
      if (input.notifSimilarAlert !== undefined) updateData.notifSimilarAlert = input.notifSimilarAlert
      if (input.notifFavoriteAlert !== undefined) updateData.notifFavoriteAlert = input.notifFavoriteAlert

      await db.update(user).set(updateData).where(eq(user.id, ctx.session.user.id))
      return { success: true }
    }),
})
