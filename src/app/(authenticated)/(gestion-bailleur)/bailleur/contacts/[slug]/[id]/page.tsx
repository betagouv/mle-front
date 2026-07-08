import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound, redirect } from 'next/navigation'
import { CandidatureDetail } from '~/components/bailleur/candidatures/candidature-detail'
import { ContactDetail } from '~/components/bailleur/contacts/contact-detail'
import { getBailleurContext } from '~/server/bailleur/get-bailleur-context'
import { getQueryClient, trpc } from '~/server/trpc/server'
import { buildHref } from '~/utils/preserve-query-params'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Props = {
  params: Promise<{ slug: string; id: string }>
  searchParams: Promise<{ ownerId?: string }>
}

export default async function ContactDetailPage({ params, searchParams }: Props) {
  const awaitedSearchParams = await searchParams
  const ctx = await getBailleurContext(awaitedSearchParams.ownerId)

  if (!ctx.hasPermission('manage_applications')) redirect(buildHref('/bailleur/tableau-de-bord', awaitedSearchParams))
  if (ctx.owner.contactMode === 'none') return notFound()

  const { slug, id } = await params
  if (!UUID_REGEX.test(id)) return notFound()

  const queryClient = getQueryClient()

  if (ctx.owner.contactMode === 'dossier_facile') {
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
