'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { tss } from 'tss-react'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const NearbyAccommodations = ({ nearbyAccommodations }: { nearbyAccommodations: TGetAccomodationsResponse }) => {
  const { classes } = useStyles()
  const t = useTranslations('accomodation')
  const [currentIndex, setCurrentIndex] = useState(0)
  const nearbyFeatures = nearbyAccommodations.results.features
  const maxIndex = nearbyFeatures.length - 1

  const handlePrevious = () => setCurrentIndex((prev) => (prev > 0 ? prev - 1 : maxIndex))

  const handleNext = () => setCurrentIndex((prev) => (prev < maxIndex ? prev + 1 : 0))

  return (
    <>
      <div className={classes.nearbySection}>
        <p className={classes.nearbyTitle}>{t('nearby.title')}</p>
        <div className={classes.buttonGroup}>
          <Button
            size="small"
            onClick={handlePrevious}
            iconId="ri-arrow-left-s-line"
            priority="tertiary"
            title={t('nearby.buttons.previous')}
          />
          <Button size="small" onClick={handleNext} iconId="ri-arrow-right-s-line" priority="tertiary" title={t('nearby.buttons.next')} />
        </div>
      </div>
      <div className={classes.nearbyCard}>
        {nearbyAccommodations.results.features.length > 0 && (
          <div key={nearbyAccommodations.results.features[currentIndex].properties.slug}>
            <h5 className={classes.nearbyCardTitle}>{nearbyAccommodations.results.features[currentIndex].properties.name}</h5>
            <div className={classes.nearbyCardInfo}>
              <span className={fr.cx('ri-community-line')}>
                {t('nearby.count', { count: nearbyAccommodations.results.features[currentIndex].properties.nb_total_apartments })}
              </span>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const useStyles = tss.create({
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
  },
  nearbyCard: {
    background: 'white',
    border: '1px solid var(--border-default-grey)',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    padding: '2rem 1rem',
  },
  nearbyCardInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },

  nearbyCardTitle: {
    color: 'var(--text-active-blue-france)',
    cursor: 'pointer',
  },
  nearbySection: {
    alignItems: 'center',
    display: 'flex',
    justifyContent: 'space-between',
    margin: '1rem 0',
  },
  nearbyTitle: {
    margin: 0,
  },
})
