import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import { getTranslations } from 'next-intl/server'
import { TAccomodationDetails } from '~/schemas/accommodations/accommodations'
import styles from './accommodation-residence.module.css'

type AccommodationResidenceProps = {
  accommodation: TAccomodationDetails
}

export const AccommodationResidence = async ({ accommodation }: AccommodationResidenceProps) => {
  const t = await getTranslations('accomodation')

  const studioPriceTiles = [
    {
      type: 'T1',
      min: accommodation.price_min_t1,
      max: accommodation.price_max_t1,
      enabled: !!accommodation.nb_t1 && accommodation.price_min_t1 && accommodation.price_max_t1,
    },
    {
      type: 'T1bis',
      min: accommodation.price_min_t1_bis,
      max: accommodation.price_max_t1_bis,
      enabled: !!accommodation.nb_t1_bis && accommodation.price_min_t1_bis && accommodation.price_max_t1_bis,
    },
    {
      type: 'T2',
      min: accommodation.price_min_t2,
      max: accommodation.price_max_t2,
      enabled: !!accommodation.nb_t2 && accommodation.price_min_t2 && accommodation.price_max_t2,
    },
  ]
  const appartmentsPriceTiles = [
    {
      type: 'T3',
      min: accommodation.price_min_t3,
      max: accommodation.price_max_t3,
      enabled: !!accommodation.nb_t3 && accommodation.price_min_t3 && accommodation.price_max_t3,
    },
    {
      type: 'T4+',
      min: accommodation.price_min_t4_more,
      max: accommodation.price_max_t4_more,
      enabled: !!accommodation.nb_t4_more && accommodation.price_min_t4_more && accommodation.price_max_t4_more,
    },
  ]
  const hasStudio = studioPriceTiles.some((tile) => tile.enabled)
  const hasAppartements = appartmentsPriceTiles.some((tile) => tile.enabled)

  if (!hasStudio && !hasAppartements) {
    return (
      <div className={styles.section}>
        <h4>{t('availableAccommodations')}</h4>
        <Alert
          severity="warning"
          title="Informations à venir"
          description="Le bailleur n'a pas encore partagé les informations au sujet des logements de la résidence."
        />
      </div>
    )
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionContent}>
        <h4 className={fr.cx('fr-mb-0')}>{t('availableAccommodations')}</h4>
        <div className={styles.accommodationsContainer}>
          <div>
            <div className={styles.mainContainer}>
              {studioPriceTiles
                .filter((tile) => tile.enabled)
                .map((stud, idx) => (
                  <div className={clsx(idx === 0 && styles.borderRightGrid, styles.studioContainer)} key={stud.type}>
                    <span className={fr.cx('ri-user-line', 'fr-text--bold')}>{t('studio', { type: stud.type })}</span>
                    <div className={styles.pricesTiles}>
                      <span
                        style={{
                          backgroundColor: fr.colors.options.yellowTournesol._950_100.default,
                          borderRadius: '4px',
                          color: fr.colors.options.yellowTournesol.sun407moon922.default,
                          padding: '0 0.5rem',
                        }}
                        className={fr.cx('fr-text--bold')}
                      >
                        DE {stud.min} À {stud.max} €
                      </span>
                    </div>
                  </div>
                ))}

              {appartmentsPriceTiles
                .filter((tile) => tile.enabled)
                .map((appartment, idx) => (
                  <div className={clsx(idx === 0 && styles.borderRightGrid, styles.appartmentsContainer)} key={appartment.type}>
                    <span className={fr.cx('ri-user-line', 'fr-text--bold')}>{t('appartement', { type: appartment.type })}</span>
                    <div className={styles.pricesTiles}>
                      <span
                        style={{
                          backgroundColor: fr.colors.options.yellowTournesol._950_100.default,
                          borderRadius: '4px',
                          color: fr.colors.options.yellowTournesol.sun407moon922.default,
                          padding: '0 0.5rem',
                        }}
                        className={fr.cx('fr-text--bold')}
                      >
                        DE {appartment.min} À {appartment.max} €
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
        <div className={styles.simulatorContainer}>
          <p className={fr.cx('fr-mb-0')}>{t('simulator')}</p>
          <Button
            size="small"
            iconId="fr-icon-money-euro-circle-fill"
            iconPosition="left"
            linkProps={{ href: '/simuler-mes-aides-au-logement' }}
            priority="tertiary"
          >
            {t('simulatorButton')}
          </Button>
        </div>
      </div>
    </div>
  )
}
