import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound, redirect } from 'next/navigation'
import { CandidatureDetail } from '~/components/bailleur/candidatures/candidature-detail'
import { ContactDetail } from '~/components/bailleur/contacts/contact-detail'
import { EOwnerContactMode } from '~/enums/owner-contact-mode'
import { getBailleurContext } from '~/server/bailleur/get-bailleur-context'
import { getQueryClient, trpc } from '~/server/trpc/server'
import { buildHref } from '~/utils/preserve-query-params'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ ownerId?: string }>
}

export default async function ContactDetailPage({ params, searchParams }: Props) {
  const [{ slug, id }, awaitedSearchParams] = await Promise.all([params, searchParams])
  const ctx = await getBailleurContext(awaitedSearchParams.ownerId)

  if (!ctx.hasPermission('manage_applications')) redirect(buildHref('/bailleur/tableau-de-bord', awaitedSearchParams))
  if (ctx.owner.contactMode === EOwnerContactMode.NONE) return notFound()

  const queryClient = getQueryClient()

  if (ctx.owner.contactMode === EOwnerContactMode.DOSSIER_FACILE) {
    await queryClient.prefetchQuery(trpc.bailleur.getCandidature.queryOptions({ id }))
    return (
      <HydrationBoundary state={dehydrate(queryClient)}>
        <CandidatureDetail id={id} slug={slug} />
      </HydrationBoundary>
    )
  }

  const contact = await queryClient.fetchQuery(trpc.bailleur.getContact.queryOptions({ id })).catch(() => null)
  if (!contact) return notFound()

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ContactDetail id={id} slug={slug} />
    </HydrationBoundary>
  )
}
