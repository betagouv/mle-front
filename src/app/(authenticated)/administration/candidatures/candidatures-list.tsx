'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { useQuery } from '@tanstack/react-query'
import type { ColumnDef } from '@tanstack/react-table'
import clsx from 'clsx'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { useDebounce } from 'use-debounce'
import { AdminDataTable } from '~/components/administration/admin-data-table'
import { EOwnerContactMode, OWNER_CONTACT_MODE_LABELS } from '~/enums/owner-contact-mode'
import { useTRPC } from '~/server/trpc/client'
import { sPluriel } from '~/utils/sPluriel'
import styles from '../administration.module.css'

type CandidatureRow = {
  id: number
  name: string
  slug: string
  city: string
  ownerId: number | null
  ownerName: string
  contactMode: EOwnerContactMode | null
  contactCount: number
  dossierFacileCount: number
  activeCount: number
  total: number
  canAccessOwnerSpace: boolean
}

const columns: ColumnDef<CandidatureRow, unknown>[] = [
  {
    accessorKey: 'name',
    header: 'Résidence',
    enableSorting: true,
    cell: ({ row }) => (
      <div>
        <span className="fr-text--bold">{row.original.name}</span>
        <div className="fr-text--xs fr-text-mention--grey">{row.original.city}</div>
      </div>
    ),
  },
  {
    accessorKey: 'ownerName',
    header: 'Gestionnaire',
    enableSorting: true,
    cell: ({ row }) => (
      <div>
        {row.original.ownerName}
        {row.original.contactMode && (
          <div className="fr-text--xs fr-text-mention--grey">{OWNER_CONTACT_MODE_LABELS[row.original.contactMode]}</div>
        )}
      </div>
    ),
  },
  {
    accessorKey: 'total',
    header: 'Candidatures',
    enableSorting: true,
    cell: ({ row }) => (
      <div>
        <span className="fr-text--bold">{row.original.total}</span>
        <div className="fr-text--xs fr-text-mention--grey">
          {row.original.contactCount} coordonnées · {row.original.dossierFacileCount} DossierFacile
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'activeCount',
    header: 'Encore visibles',
    enableSorting: true,
    cell: ({ row }) =>
      row.original.activeCount > 0 ? (
        <Badge severity="success" noIcon as="span">
          {row.original.activeCount}
        </Badge>
      ) : (
        <Badge noIcon as="span">
          0
        </Badge>
      ),
  },
  {
    id: 'actions',
    header: '',
    enableSorting: false,
    cell: ({ row }) =>
      // Un admin n'accède à l'espace d'un gestionnaire que s'il y est rattaché : sans le lien, la
      // redirection retomberait sur un autre bailleur sans rien dire.
      row.original.canAccessOwnerSpace ? (
        <Button
          priority="tertiary no outline"
          size="small"
          iconId="fr-icon-arrow-right-line"
          iconPosition="right"
          linkProps={{ href: `/bailleur/contacts/${row.original.slug}?ownerId=${row.original.ownerId}` }}
        >
          Espace gestionnaire
        </Button>
      ) : (
        <span className="fr-text--xs fr-text-mention--grey" title="Liez-vous à ce gestionnaire depuis le tableau de bord">
          Non rattaché
        </span>
      ),
  },
]

export function AdminCandidaturesList() {
  const trpc = useTRPC()
  const [{ search, page }, setQueryStates] = useQueryStates({
    search: parseAsString.withDefault(''),
    page: parseAsInteger.withDefault(1),
  })
  const [debouncedSearch] = useDebounce(search, 300)

  const { data: overview, isLoading: isOverviewLoading } = useQuery(trpc.admin.candidatures.overview.queryOptions())
  const { data, isLoading } = useQuery(
    trpc.admin.candidatures.list.queryOptions({
      page,
      search: debouncedSearch.length >= 2 ? debouncedSearch : undefined,
    }),
  )

  const statCards = [
    {
      label: `Candidature${sPluriel(overview?.total ?? 0)} au total`,
      value: overview?.total ?? 0,
      icon: 'fr-icon-file-text-line',
      colorClass: styles.statCardBlue,
    },
    {
      label: `Encore visible${sPluriel(overview?.active ?? 0)} (${overview?.retentionDays ?? 30} j)`,
      value: overview?.active ?? 0,
      icon: 'fr-icon-eye-line',
      colorClass: styles.statCardGreen,
    },
    {
      label: `À traiter par les gestionnaires`,
      value: overview?.toProcess ?? 0,
      icon: 'fr-icon-time-line',
      colorClass: styles.statCardOrange,
    },
    {
      label: `Résidence${sPluriel(overview?.residences ?? 0)} concernée${sPluriel(overview?.residences ?? 0)}`,
      value: overview?.residences ?? 0,
      icon: 'fr-icon-home-4-line',
      colorClass: styles.statCardPurple,
    },
  ]

  return (
    <>
      <div className="fr-mb-3w">
        <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
          <div className={styles.pageIcon}>
            <span className={clsx(styles.pageIconBadge, 'fr-icon-file-text-line')} aria-hidden="true" />
          </div>
          <h1 className="fr-h3 fr-mb-0">Candidatures</h1>
        </div>
        <p className="fr-text--sm fr-text-mention--grey fr-mt-1v">
          Candidatures reçues par résidence, tous canaux confondus. Passé {overview?.retentionDays ?? 30} jours, une candidature n&apos;est
          plus visible du gestionnaire mais reste comptée ici.
        </p>
      </div>

      <div className={clsx(styles.statsGrid, 'fr-mb-3w')}>
        {statCards.map((card) => (
          <div key={card.label} className={clsx(styles.statCard, card.colorClass)}>
            <div className={styles.statLabel}>{card.label}</div>
            <div className={clsx(styles.statValue, 'fr-mt-1v')}>{isOverviewLoading ? '-' : card.value}</div>
            <span className={clsx(card.icon, styles.statIcon)} aria-hidden="true" />
          </div>
        ))}
      </div>

      <div className="fr-grid-row fr-grid-row--gutters fr-mb-2w fr-align-items-end">
        <div className="fr-col-md-5">
          <Input
            label="Rechercher"
            nativeInputProps={{
              placeholder: 'Résidence, ville, gestionnaire...',
              value: search,
              onChange: (e) => setQueryStates({ search: e.target.value, page: 1 }),
            }}
          />
        </div>
      </div>

      <AdminDataTable
        columns={columns}
        data={data?.items ?? []}
        pageCount={data?.pageCount ?? 0}
        page={page}
        onPageChange={(p) => setQueryStates({ page: p })}
        isLoading={isLoading}
      />
    </>
  )
}
