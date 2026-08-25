import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { createToast } from '~/components/ui/createToast'
import { useTRPC } from '~/server/trpc/client'

export const useDisconnectDossierFacile = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const trpc = useTRPC()

  return useMutation(
    trpc.dossierFacile.disconnect.mutationOptions({
      onSuccess: async () => {
        // La déconnexion emporte les candidatures : les favoris les restituent, il faut les rafraîchir aussi.
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.dossierFacile.tenant.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.favorites.list.queryKey() }),
        ])
        createToast({ priority: 'success', message: 'Votre compte DossierFacile a été déconnecté.' })
        router.refresh()
      },
      onError: (error) => {
        createToast({
          priority: 'error',
          message: error.message || 'Une erreur est survenue lors de la déconnexion de votre compte DossierFacile.',
        })
      },
    }),
  )
}
