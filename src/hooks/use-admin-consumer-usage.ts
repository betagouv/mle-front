'use client'

import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/server/trpc/client'

export const useAdminConsumerUsage = (keyId: string | null, days = 30) => {
  const trpc = useTRPC()
  return useQuery({
    ...trpc.admin.consumers.usage.queryOptions({ keyId: keyId ?? '', days }),
    enabled: !!keyId,
  })
}
