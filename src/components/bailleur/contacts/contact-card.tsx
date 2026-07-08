'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import clsx from 'clsx'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { forwardRef, type HTMLAttributes } from 'react'
import { CONTACT_STATUS_CONFIG, type ContactStatus } from '~/enums/contact-status'
import { formatDayjs } from '~/utils/dayjs'
import { buildHref } from '~/utils/preserve-query-params'
import styles from './contact-card.module.css'

export interface ContactItem {
  id: string
  studentName: string | null
  scholarshipStatus: string | null
  apartmentType: string | null
  status: string
  createdAt: string | Date
  source: 'dossier_facile' | 'contact'
}

interface Props extends HTMLAttributes<HTMLDivElement> {
  contact: ContactItem
  slug: string
  /** Carte inerte (overlay de drag) : pas de lien ni d'ombre de survol. */
  overlay?: boolean
}

export const ContactCard = forwardRef<HTMLDivElement, Props>(({ contact, slug, overlay, className, ...rest }, ref) => {
  const locale = useLocale()
  const searchParams = useSearchParams()
  const config = CONTACT_STATUS_CONFIG[contact.status as ContactStatus] ?? CONTACT_STATUS_CONFIG.a_moderer

  return (
    <div
      ref={ref}
      className={clsx(styles.card, overlay && styles.overlay, className)}
      style={{ borderBottomColor: config.barColor }}
      {...rest}
    >
      <Badge severity={config.severity ?? undefined} noIcon>
        {config.label}
      </Badge>

      <span className="fr-text-mention--grey fr-text--xs fr-mt-1v fr-mb-2v">
        Postée le {formatDayjs(contact.createdAt, 'DD MMMM YYYY', locale)}
      </span>

      <span className={clsx(styles.name, contact.status === 'non_retenu' ? styles.nameMuted : styles.nameActive)}>
        {contact.studentName ?? 'Candidat'}
      </span>

      {contact.scholarshipStatus === 'yes' && <span className={clsx('ri-money-euro-circle-line', styles.boursier)}> Boursier</span>}

      <div className={styles.footer}>
        {contact.source === 'dossier_facile' && (
          <span className={styles.dfLogo} aria-label="DossierFacile">
            Dossier<strong>Facile</strong>
          </span>
        )}
        {!overlay && (
          <Link
            href={buildHref(`/bailleur/contacts/${slug}/${contact.id}`, searchParams)}
            className={clsx('ri-arrow-right-line fr-link--no-underline fr-text-title--blue-france', styles.arrow)}
            aria-label={`Voir ${contact.studentName ?? 'le candidat'}`}
          />
        )}
      </div>
    </div>
  )
})

ContactCard.displayName = 'ContactCard'
