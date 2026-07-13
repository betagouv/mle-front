'use client'

import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { type CalculationResult } from '~/components/helps-simulator/results/aid-calculator'
import { ZONE_LABELS } from '~/components/helps-simulator/results/zone-utils'
import styles from './help-simulator-header-results.module.css'

interface AidsLocalisationInfoProps {
  results: CalculationResult
}

export const AidsLocalisationInfo: FC<AidsLocalisationInfoProps> = ({ results }) => {
  const t = useTranslations('simulator.results.localisation')

  return (
    <>
      <div className="fr-flex fr-align-items-center fr-mb-3w">
        <div className="fr-flex fr-flex-gap-2v">
          <span className="fr-text--bold fr-text--sm fr-mb-0">{t('label')}</span>
          <span className={clsx('fr-text--sm fr-mb-0', styles.localisationContainer)}>{ZONE_LABELS[results.zone]}</span>
        </div>
      </div>

      {results.localAids.length > 0 && (
        <div className="fr-flex fr-align-items-center fr-flex-gap-2v fr-border-top fr-pt-3w">
          <span className="ri-information-line" aria-hidden="true" />
          <span>
            {t.rich('localAidsInfo', {
              name: results.localAids[0],
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </span>
        </div>
      )}
    </>
  )
}
