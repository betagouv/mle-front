'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createToast } from '~/components/ui/createToast'
import { useTRPC, useTRPCClient } from '~/server/trpc/client'

export const useAdminResetUserPassword = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const t = useTranslations('toast')

  return useMutation({
    mutationFn: (id: string) => trpcClient.admin.users.resetPassword.mutate({ id }),
    onSuccess: async (_data, id) => {
      await queryClient.invalidateQueries({ queryKey: trpc.admin.users.getById.queryKey({ id }) })
      createToast({ priority: 'success', message: t('userPasswordReset') })
    },
    onError: () => {
      createToast({ priority: 'error', message: t('userPasswordResetError') })
    },
  })
}
