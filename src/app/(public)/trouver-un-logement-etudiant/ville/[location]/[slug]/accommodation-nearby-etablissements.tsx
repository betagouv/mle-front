'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { TNearbyEtablissement } from '~/schemas/ramsese/etablissement-superieur'
import styles from './logement.module.css'

type AccommodationNearbyEtablissementsProps = {
  etablissements: TNearbyEtablissement[]
}

const DEFAULT_VISIBLE = 5
const distanceFormatter = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function etablissementLabel(etab: TNearbyEtablissement): string {
  const name = etab.denomination ?? etab.sigle ?? etab.numeroUai
  if (etab.denomination && etab.sigle && !etab.denomination.includes(etab.sigle)) {
    return `${etab.denomination} (${etab.sigle})`
  }
  return name
}

export const AccommodationNearbyEtablissements = ({ etablissements }: AccommodationNearbyEtablissementsProps) => {
  const t = useTranslations('accomodation')
  const [expanded, setExpanded] = useState(false)

  if (etablissements.length === 0) return null

  const visible = expanded ? etablissements : etablissements.slice(0, DEFAULT_VISIBLE)
  const hasMore = etablissements.length > DEFAULT_VISIBLE

  return (
    <div className={styles.section}>
      <h4 className="fr-mb-3w">{t('nearbyEtablissements.title')}</h4>
      <ul className={styles.etablissementList}>
        {visible.map((etab) => (
          <li key={etab.numeroUai} className={styles.etablissementRow}>
            <span className={clsx(styles.markerIcon, 'ri-map-pin-2-line', 'fr-text-mention--grey')} aria-hidden="true" />
            <span className={styles.etablissementName}>{etablissementLabel(etab)}</span>
            <span className={styles.leader} aria-hidden="true" />
            <span className={styles.distance}>
              {t('nearbyEtablissements.distance', { distance: distanceFormatter.format(etab.distanceKm) })}
            </span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <Button priority="tertiary" size="small" className="fr-mt-2w" onClick={() => setExpanded((value) => !value)}>
          {expanded ? t('nearbyEtablissements.showLess') : t('nearbyEtablissements.showMore')}
        </Button>
      )}
    </div>
  )
}
