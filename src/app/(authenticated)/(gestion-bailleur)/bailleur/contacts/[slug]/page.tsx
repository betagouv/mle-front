import Badge from '@codegouvfr/react-dsfr/Badge'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import Button from '@codegouvfr/react-dsfr/Button'
import { dehydrate, HydrationBoundary } from '@tanstack/react-query'
import { notFound, redirect } from 'next/navigation'
import { ContactsBoard } from '~/components/bailleur/contacts/contacts-board'
import { getBailleurContext } from '~/server/bailleur/get-bailleur-context'
import { getQueryClient, trpc } from '~/server/trpc/server'
import { buildHref } from '~/utils/preserve-query-params'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ownerId?: string }>
}

export default async function ResidenceContactsPage({ params, searchParams }: Props) {
  const { slug } = await params
  const awaitedSearchParams = await searchParams
  const ctx = await getBailleurContext(awaitedSearchParams.ownerId)

  if (!ctx.hasPermission('manage_applications')) redirect(buildHref('/bailleur/tableau-de-bord', awaitedSearchParams))
  if (ctx.owner.contactMode === 'none') redirect(buildHref('/bailleur/contacts', awaitedSearchParams))

  const queryClient = getQueryClient()
  const data = await queryClient.fetchQuery(trpc.bailleur.listContactsByResidence.queryOptions({ slug })).catch(() => null)

  if (!data) return notFound()

  const { residence } = data

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <div className="fr-container fr-pb-12w">
        <Breadcrumb
          currentPageLabel={`Résidence ${residence.name}`}
          segments={[
            { label: 'Tableau de bord', linkProps: { href: buildHref('/bailleur/tableau-de-bord', awaitedSearchParams) } },
            { label: 'Contacts', linkProps: { href: buildHref('/bailleur/contacts', awaitedSearchParams) } },
          ]}
          classes={{ root: 'fr-mt-0 fr-mb-2w fr-pt-4w' }}
        />

        <div className="fr-flex fr-align-items-center fr-justify-content-space-between fr-flex-wrap fr-flex-gap-2v fr-mb-1w">
          <h1 className="fr-mb-0 fr-flex fr-align-items-center fr-flex-gap-2v">
            Résidence {residence.name}
            <Badge severity="success" noIcon as="span">
              {residence.disponibilites} disponibilité{residence.disponibilites > 1 ? 's' : ''}
            </Badge>
          </h1>
          <Button
            priority="secondary"
            iconId="ri-equalizer-line"
            linkProps={{ href: buildHref(`/bailleur/residences/${slug}`, awaitedSearchParams) }}
          >
            Éditer la résidence
          </Button>
        </div>
        <p className="fr-text-mention--grey fr-mb-4w">Chaque contact d'étudiant reste disponible pendant 30 jours.</p>

        <ContactsBoard slug={slug} />
      </div>
    </HydrationBoundary>
  )
}
