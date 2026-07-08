'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import Breadcrumb from '@codegouvfr/react-dsfr/Breadcrumb'
import { useSearchParams } from 'next/navigation'
import { type ReactNode } from 'react'
import { CONTACT_STATUS_CONFIG, type ContactStatus } from '~/enums/contact-status'
import { buildHref } from '~/utils/preserve-query-params'
import styles from './contact-detail.module.css'

interface Props {
  studentName: string | null
  status: string
  slug: string
  source: 'dossier_facile' | 'contact'
  /** Colonne de gauche : informations candidat (+ bloc DossierFacile). */
  children: ReactNode
  /** Colonne de droite : carte d'action contextuelle au statut. */
  actions: ReactNode
}

/** En-tête + grille commune aux fiches contact (mode `contacts`) et candidature (mode `dossier_facile`). */
export const ContactDetailLayout = ({ studentName, status, slug, source, children, actions }: Props) => {
  const searchParams = useSearchParams()
  const config = CONTACT_STATUS_CONFIG[status as ContactStatus] ?? CONTACT_STATUS_CONFIG.a_contacter
  const name = studentName ?? 'Candidat'

  return (
    <div className="fr-container fr-pb-12w">
      <Breadcrumb
        currentPageLabel={name}
        segments={[
          { label: 'Tableau de bord', linkProps: { href: buildHref('/bailleur/tableau-de-bord', searchParams) } },
          {
            label: source === 'dossier_facile' ? 'Contacts avec DossierFacile' : 'Contacts',
            linkProps: { href: buildHref(`/bailleur/contacts/${slug}`, searchParams) },
          },
        ]}
        classes={{ root: 'fr-mt-0 fr-mb-2w fr-pt-4w' }}
      />

      <div className="fr-flex fr-justify-content-space-between fr-align-items-center fr-flex-gap-2v fr-mb-4w">
        <h1 className="fr-h2 fr-mb-0">Contact de {name}</h1>
        <Badge severity={config.severity ?? undefined} noIcon>
          {config.label}
        </Badge>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-8">
          <div className={styles.panel}>{children}</div>
        </div>
        <div className="fr-col-12 fr-col-md-4">{actions}</div>
      </div>
    </div>
  )
}
