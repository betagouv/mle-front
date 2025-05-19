import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
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
  const priceTiles = [
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
  const hasAppartements = priceTiles.some((tile) => tile.enabled)

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
      <h4>{t('availableAccommodations')}</h4>
      <div className={styles.accommodationsContainer}>
        <div className={styles.studioColocBorderBottom}>
          <div className={styles.mainContainer}>
            {hasStudio && (
              <div className={clsx(styles.studioContainer, hasAppartements && styles.borderRight)}>
                <span className={fr.cx('ri-user-line', 'fr-text--bold')} style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                  STUDIO (
                  {studioPriceTiles
                    .filter((tile) => tile.enabled)
                    .map((tile) => tile.type)
                    .join(' • ')}
                  )
                </span>
                <div className={styles.pricesTiles}>
                  {studioPriceTiles
                    .filter((tile) => tile.enabled)
                    .map((tile) => (
                      <span
                        key={tile.type}
                        style={{
                          backgroundColor: fr.colors.options.yellowTournesol._950_100.default,
                          borderRadius: '4px',
                          color: fr.colors.options.yellowTournesol.sun407moon922.default,
                          padding: '0 0.5rem',
                        }}
                        className={fr.cx('fr-text--bold')}
                      >
                        {tile.type}: de {tile.min} à {tile.max} €
                      </span>
                    ))}
                </div>
              </div>
            )}

            {hasAppartements && (
              <div className={styles.appartmentsContainer}>
                <span className={fr.cx('ri-user-line', 'fr-text--bold')} style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                  Appartements (
                  {priceTiles
                    .filter((tile) => tile.enabled)
                    .map((tile) => tile.type)
                    .join(' • ')}
                  )
                </span>
                <div className={styles.pricesTiles}>
                  {priceTiles
                    .filter((tile) => tile.enabled)
                    .map((tile) => (
                      <span
                        style={{
                          backgroundColor: fr.colors.options.yellowTournesol._950_100.default,
                          borderRadius: '4px',
                          color: fr.colors.options.yellowTournesol.sun407moon922.default,
                          padding: '0 0.5rem',
                        }}
                        className={fr.cx('fr-text--bold')}
                        key={tile.type}
                      >
                        {tile.type}: de {tile.min} à {tile.max} €
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div className={styles.warrantyContainer}>
          <span className={fr.cx('ri-information-line')}>
            Avance déductible du premier mois de loyer: <b>100 €</b>
          </span>
        </div>
      </div>
    </div>
  )
}
