'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { parseAsInteger, useQueryStates } from 'nuqs'
import { createToast } from '~/components/ui/createToast'
import { TCreateResidence } from '~/schemas/accommodations/create-residence'
import { useTRPC, useTRPCClient } from '~/server/trpc/client'
import { buildHref } from '~/utils/preserve-query-params'

export const useCreateResidence = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const t = useTranslations('toast')
  const [{ ownerId }] = useQueryStates({ ownerId: parseAsInteger })

  return useMutation({
    mutationFn: async (data: TCreateResidence) => {
      const { imagesFiles, ...fields } = data

      const result = await trpcClient.bailleur.create.mutate({
        ...fields,
        name: fields.name!,
        ownerId: ownerId ?? undefined,
      })

      if (imagesFiles?.length && result.slug) {
        const formData = new FormData()
        imagesFiles.forEach((file) => formData.append('images', file))

        const uploadResponse = await fetch(`/api/accommodations/my/${result.slug}/upload/`, {
          method: 'POST',
          body: formData,
        })

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json()
          const imageUrls: string[] = uploadData.imagesUrls || []
          if (imageUrls.length > 0) {
            await trpcClient.bailleur.update.mutate({
              slug: result.slug,
              imagesUrls: imageUrls,
              name: fields.name,
            })
          }
        }
      }

      return result
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({
        queryKey: trpc.bailleur.list.queryKey(),
        exact: false,
      })
      createToast({
        priority: 'success',
        message: t('residenceCreated'),
      })
      if (data?.slug) {
        router.push(buildHref(`/bailleur/residences/${data.slug}`, { ownerId: ownerId?.toString() }))
      } else {
        router.push(buildHref('/bailleur/residences', { ownerId: ownerId?.toString() }))
      }
    },
    onError: () => {
      createToast({
        priority: 'error',
        message: t('residenceCreateError'),
      })
    },
  })
}
