import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createToast } from '~/components/ui/createToast'
import { useTRPC } from '~/server/trpc/client'

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  return useMutation(
    trpc.student.updateNotificationPreferences.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.student.getNotificationPreferences.queryKey(),
        })
        createToast({ priority: 'success', message: 'Préférences de notifications mises à jour.' })
      },
      onError: (error) => {
        createToast({
          priority: 'error',
          message: error.message || 'Une erreur est survenue lors de la mise à jour des préférences.',
        })
      },
    }),
  )
}
