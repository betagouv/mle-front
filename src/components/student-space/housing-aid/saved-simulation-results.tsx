'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { type HelpSimulatorFormData } from '~/components/helps-simulator/help-simulator-schema'
import { calculateAllAids } from '~/components/helps-simulator/results/aid-calculator'
import { AidsLocalisationInfo } from '~/components/helps-simulator/results/aids-localisation-info'
import { AidsResults, type AidsResultsView } from '~/components/helps-simulator/results/aids-results-view'
import styles from './saved-simulation-results.module.css'

interface SavedSimulationResultsProps {
  inputs: HelpSimulatorFormData | null
}

export const SavedSimulationResults = ({ inputs }: SavedSimulationResultsProps) => {
  const t = useTranslations('student.housingAid')
  const [view, setView] = useState<AidsResultsView>('eligible')

  if (!inputs) {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-flex-gap-3v fr-py-6w">
        <span className={`fr-icon-money-euro-circle-line ${styles.icon}`} aria-hidden="true" />
        <p className="fr-text--lg fr-mb-0 fr-text--center">{t('emptyState')}</p>
        <Button linkProps={{ href: '/simuler-mes-aides-au-logement' }} iconId="ri-arrow-right-line" iconPosition="right">
          {t('emptyCta')}
        </Button>
      </div>
    )
  }

  const results = calculateAllAids(inputs)

  return (
    <div className="fr-flex fr-direction-column">
      <div className="boxShadow fr-p-3w fr-mb-4w">
        <AidsLocalisationInfo results={results} />
      </div>

      <AidsResults results={results} view={view} onViewChange={setView} />

      <div className="fr-flex fr-justify-content-center fr-mt-4w">
        <Button priority="secondary" linkProps={{ href: '/simuler-mes-aides-au-logement' }} iconId="ri-refresh-line" iconPosition="left">
          {t('restartCta')}
        </Button>
      </div>
    </div>
  )
}
