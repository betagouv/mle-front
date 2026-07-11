'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createToast } from '~/components/ui/createToast'
import { useTRPC, useTRPCClient } from '~/server/trpc/client'

export const useAdminRevokeConsumer = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()

  return useMutation({
    mutationFn: (keyId: string) => trpcClient.admin.consumers.revoke.mutate({ keyId }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trpc.admin.consumers.list.queryKey() })
      createToast({ priority: 'success', message: 'Clé révoquée' })
    },
    onError: (error) => {
      createToast({ priority: 'error', message: error.message || 'Erreur lors de la révocation' })
    },
  })
}
