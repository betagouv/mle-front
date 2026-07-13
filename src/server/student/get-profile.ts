import { getQueryClient, trpc } from '~/server/trpc/server'
import { getServerSession } from '~/services/better-auth'

export const getStudentProfile = async () => {
  const auth = await getServerSession()
  if (!auth) return null

  return getQueryClient().fetchQuery(trpc.student.getProfile.queryOptions())
}
