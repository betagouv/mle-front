import { HydrationBoundary } from '@tanstack/react-query'
import { notFound, redirect } from 'next/navigation'
import { CandidatureDetail } from '~/components/bailleur/candidatures/candidature-detail'
import { getBailleurContext } from '~/server/bailleur/get-bailleur-context'
import { buildHref } from '~/utils/preserve-query-params'
import { getCandidateDetailsPageContext } from './get-candidate-details-page-context'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ ownerId?: string }>
}

export default async function CandidatureDetailPage({ params, searchParams }: Props) {
  const awaitedSearchParams = await searchParams
  const ctx = await getBailleurContext(awaitedSearchParams.ownerId)

  if (!ctx.hasPermission('manage_applications')) redirect(buildHref('/bailleur/tableau-de-bord', awaitedSearchParams))

  if (!ctx.owner.acceptDossierFacileApplications) {
    return notFound()
  }

  const { id } = await params

  if (!UUID_REGEX.test(id)) return notFound()

  const { dehydratedState } = await getCandidateDetailsPageContext(id)

  return (
    <HydrationBoundary state={dehydratedState}>
      <CandidatureDetail id={id} />
    </HydrationBoundary>
  )
}
