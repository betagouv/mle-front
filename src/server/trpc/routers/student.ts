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
        similarAccommodationAlertsEnabled: user.similarAccommodationAlertsEnabled,
        favoriteAlertsEnabled: user.favoriteAlertsEnabled,
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
        similarAccommodationAlertsEnabled: true,
        favoriteAlertsEnabled: true,
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
      .select({
        similarAccommodationAlertsEnabled: user.similarAccommodationAlertsEnabled,
        favoriteAlertsEnabled: user.favoriteAlertsEnabled,
      })
      .from(user)
      .where(eq(user.id, ctx.session.user.id))

    return row ?? { similarAccommodationAlertsEnabled: true, favoriteAlertsEnabled: true }
  }),

  updateNotificationPreferences: userProcedure
    .input(z.object({ similarAccommodationAlertsEnabled: z.boolean().optional(), favoriteAlertsEnabled: z.boolean().optional() }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Partial<{ similarAccommodationAlertsEnabled: boolean; favoriteAlertsEnabled: boolean }> = {}
      if (input.similarAccommodationAlertsEnabled !== undefined)
        updateData.similarAccommodationAlertsEnabled = input.similarAccommodationAlertsEnabled
      if (input.favoriteAlertsEnabled !== undefined) updateData.favoriteAlertsEnabled = input.favoriteAlertsEnabled

      await db.update(user).set(updateData).where(eq(user.id, ctx.session.user.id))
      return { success: true }
    }),
})
