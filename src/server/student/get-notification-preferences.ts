import { getQueryClient, trpc } from '~/server/trpc/server'
import { getServerSession } from '~/services/better-auth'

export const getNotificationPreferences = async () => {
  const auth = await getServerSession()
  if (!auth) return { similarAccommodationAlertsEnabled: true, favoriteAlertsEnabled: true }

  return getQueryClient().fetchQuery(trpc.student.getNotificationPreferences.queryOptions())
}
