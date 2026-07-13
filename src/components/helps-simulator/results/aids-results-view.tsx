'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { type CalculationResult } from '~/components/helps-simulator/results/aid-calculator'
import { AidCard } from '~/components/helps-simulator/results/aid-card'

export type AidsResultsView = 'eligible' | 'ineligible'

interface AidsResultsViewProps {
  results: CalculationResult
  view: AidsResultsView
  onViewChange: (view: AidsResultsView) => void
}

export const AidsResults: FC<AidsResultsViewProps> = ({ results, view, onViewChange }) => {
  const t = useTranslations('simulator.results.aids')

  const eligibleAids = results.aids.filter((aid) => aid.isEligible)
  const ineligibleAids = results.aids.filter((aid) => !aid.isEligible)

  const displayedAids = view === 'eligible' ? eligibleAids : ineligibleAids
  const eligibleLabel = t('eligibleCount', { count: eligibleAids.length })
  const ineligibleLabel = t('ineligibleCount', { count: ineligibleAids.length })

  return (
    <div className="fr-flex fr-direction-column">
      <div className="fr-flex fr-justify-content-center fr-mb-2w">
        <Button priority={view === 'eligible' ? 'secondary' : 'tertiary'} onClick={() => onViewChange('eligible')}>
          {eligibleLabel}
        </Button>
        <Button priority={view === 'ineligible' ? 'secondary' : 'tertiary'} onClick={() => onViewChange('ineligible')}>
          {ineligibleLabel}
        </Button>
      </div>

      <div className="fr-pt-3w">
        <h3 className="fr-h5 fr-mb-3w">{view === 'eligible' ? eligibleLabel : ineligibleLabel}</h3>
        {view === 'eligible' && (
          <div className="fr-flex fr-direction-column">
            <span className="fr-text--bold">{t('disclaimerTitle')}</span>
            <span className="fr-text--sm">{t('disclaimerSubtitle')}</span>
          </div>
        )}
        {displayedAids.length > 0 ? (
          <div className="fr-flex fr-direction-column fr-flex-gap-4v">
            {displayedAids.map((aid) => (
              <AidCard key={aid.id} aid={aid} />
            ))}
          </div>
        ) : (
          <p className="fr-text--sm">{view === 'eligible' ? t('emptyEligible') : t('emptyIneligible')}</p>
        )}
      </div>
    </div>
  )
}
