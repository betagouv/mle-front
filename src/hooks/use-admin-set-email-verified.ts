'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createToast } from '~/components/ui/createToast'
import { useTRPC, useTRPCClient } from '~/server/trpc/client'

export const useAdminSetEmailVerified = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const t = useTranslations('toast')

  return useMutation({
    mutationFn: (data: { id: string; emailVerified: boolean }) => trpcClient.admin.users.setEmailVerified.mutate(data),
    onSuccess: async (updated, variables) => {
      await queryClient.invalidateQueries({ queryKey: trpc.admin.users.list.queryKey() })
      await queryClient.invalidateQueries({ queryKey: trpc.admin.users.getById.queryKey({ id: updated.id }) })
      createToast({ priority: 'success', message: variables.emailVerified ? t('userActivated') : t('userDeactivated') })
    },
    onError: (_error, variables) => {
      createToast({
        priority: 'error',
        message: variables.emailVerified ? t('userActivateError') : t('userDeactivateError'),
      })
    },
  })
}
