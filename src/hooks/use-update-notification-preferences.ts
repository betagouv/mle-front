import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createToast } from '~/components/ui/createToast'
import { useTRPC } from '~/server/trpc/client'

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const trpc = useTRPC()

  return useMutation(
    trpc.student.updateNotificationPreferences.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.student.getNotificationPreferences.queryKey(),
        })
        createToast({ priority: 'success', message: 'Préférences de notifications mises à jour.' })
        router.refresh()
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
