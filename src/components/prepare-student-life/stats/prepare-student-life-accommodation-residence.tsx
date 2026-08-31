import { fr } from '@codegouvfr/react-dsfr'
import { getTranslations } from 'next-intl/server'
import { TPrepareStudentLifeAccommodationResidence } from '~/schemas/accommodations/accommodations'
import styles from './prepare-student-life-accommodation-residence.module.css'

export const PrepareStudentLifeAccommodationResidence = async ({ typologies, location }: TPrepareStudentLifeAccommodationResidence) => {
  const t = await getTranslations('prepareStudentLife.residence')
  const studioPriceTiles = [
    { type: 'T1', enabled: !!typologies.t1 },
    { type: 'T1bis', enabled: !!typologies.t1_bis },
    { type: 'T2', enabled: !!typologies.t2 },
  ]
  const priceTiles = [
    { type: 'T3', enabled: !!typologies.t3 },
    { type: 'T4', enabled: !!typologies.t4 },
    { type: 'T5', enabled: !!typologies.t5 },
    { type: 'T6', enabled: !!typologies.t6 },
    { type: 'T7', enabled: !!typologies.t7_more },
  ]

  return (
    <div className={styles.priceContainer}>
      <h3 style={{ margin: 0 }}>{t('title', { location })}</h3>
      <div className={styles.accommodationsContainer}>
        <div className={styles.studioColocBorderBottom}>
          <div className={styles.mainContainer}>
            <div className={styles.studioContainer}>
              <span className="ri-user-line fr-text--bold" style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                {t('studio', {
                  types: studioPriceTiles
                    .filter((tile) => tile.enabled)
                    .map((tile) => tile.type)
                    .join(' • '),
                })}
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
                      className="fr-text--bold"
                    >
                      {tile.type}
                    </span>
                  ))}
              </div>
            </div>

            <div className={styles.appartmentsContainer}>
              <span className="ri-user-line fr-text--bold" style={{ color: fr.colors.decisions.text.mention.grey.default }}>
                {t('apartments', {
                  types: priceTiles
                    .filter((tile) => tile.enabled)
                    .map((tile) => tile.type)
                    .join(' • '),
                })}
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
                      className="fr-text--bold"
                      key={tile.type}
                    >
                      {tile.type}
                    </span>
                  ))}
              </div>
            </div>
          </div>
        </div>
        <div className={styles.warrantyContainer}>
          <span className="ri-information-line">{t('deposit')}</span>
        </div>
      </div>
      <p style={{ margin: 0 }}>
        <span className="ri-thumb-up-line">
          {t.rich('rentCap', { location, b: (chunks) => <span className="fr-text--bold">{chunks}</span> })}
        </span>
      </p>
    </div>
  )
}
