import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { createToast } from '~/components/ui/createToast'
import { useTRPC } from '~/server/trpc/client'

interface UseSaveHousingAidSimulationOptions {
  /** Ne pas afficher le toast de succès (ex. sauvegarde automatique post-inscription). */
  silent?: boolean
}

export const useSaveHousingAidSimulation = (options?: UseSaveHousingAidSimulationOptions) => {
  const t = useTranslations('simulator.results.saveBanner')
  const queryClient = useQueryClient()
  const trpc = useTRPC()

  const { mutateAsync, isPending } = useMutation(
    trpc.housingAidSimulation.save.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.housingAidSimulation.get.queryKey(),
        })
        if (!options?.silent) {
          createToast({
            priority: 'success',
            message: t('successToast'),
          })
        }
      },
      onError: (error) => {
        createToast({
          priority: 'error',
          message: error.message || t('errorToast'),
        })
      },
    }),
  )

  return {
    mutateAsync,
    isLoading: isPending,
  }
}
