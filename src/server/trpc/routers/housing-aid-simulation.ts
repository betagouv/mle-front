import { eq } from 'drizzle-orm'
import { type HelpSimulatorFormData, helpSimulatorSchema } from '~/components/helps-simulator/help-simulator-schema'
import { db } from '~/server/db'
import { housingAidSimulations } from '~/server/db/schema'
import { createTRPCRouter, userProcedure } from '../init'

export const housingAidSimulationRouter = createTRPCRouter({
  get: userProcedure.query(async ({ ctx }): Promise<HelpSimulatorFormData | null> => {
    const [row] = await db
      .select({ inputs: housingAidSimulations.inputs })
      .from(housingAidSimulations)
      .where(eq(housingAidSimulations.userId, ctx.session.user.id))

    if (!row) return null

    const parsed = helpSimulatorSchema.safeParse(row.inputs)
    if (!parsed.success) return null

    return parsed.data
  }),

  save: userProcedure.input(helpSimulatorSchema).mutation(async ({ ctx, input }) => {
    const inputs: HelpSimulatorFormData = {
      ...input,
      monthlyRent: typeof input.monthlyRent === 'number' && !Number.isNaN(input.monthlyRent) ? input.monthlyRent : undefined,
    }

    await db
      .insert(housingAidSimulations)
      .values({ userId: ctx.session.user.id, inputs })
      .onConflictDoUpdate({
        target: housingAidSimulations.userId,
        set: { inputs, updatedAt: new Date() },
      })

    return { success: true }
  }),
})
