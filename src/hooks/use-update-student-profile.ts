import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createToast } from '~/components/ui/createToast'
import { useTRPC } from '~/server/trpc/client'
import { authClient } from '~/services/better-auth-client'

export const useUpdateStudentProfile = () => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const router = useRouter()

  return useMutation(
    trpc.student.updateProfile.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.student.getProfile.queryKey() })
        // La mise à jour passe par tRPC, hors de better-auth : sans ce signal, `useSession` continue
        // de servir l'ancien instantané et les formulaires pré-remplis (candidature) restent vides.
        authClient.$store.notify('$sessionSignal')
        createToast({ priority: 'success', message: 'Vos informations ont été mises à jour.' })
        router.refresh()
      },
      onError: (error) => {
        createToast({
          priority: 'error',
          message: error.message || 'Une erreur est survenue lors de la mise à jour de votre profil.',
        })
      },
    }),
  )
}
