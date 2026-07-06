import { getTranslations } from 'next-intl/server'
import type { TNearbyEtablissement } from '~/schemas/ramsese/etablissement-superieur'
import styles from './logement.module.css'

type AccommodationNearbyEtablissementsProps = {
  etablissements: TNearbyEtablissement[]
}

const distanceFormatter = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function etablissementLabel(etab: TNearbyEtablissement): string {
  const name = etab.denomination ?? etab.sigle ?? etab.numeroUai
  if (etab.denomination && etab.sigle && !etab.denomination.includes(etab.sigle)) {
    return `${etab.denomination} (${etab.sigle})`
  }
  return name
}

export const AccommodationNearbyEtablissements = async ({ etablissements }: AccommodationNearbyEtablissementsProps) => {
  if (etablissements.length === 0) return null

  const t = await getTranslations('accomodation')

  return (
    <div className={styles.section}>
      <h4 className="fr-mb-3w">{t('nearbyEtablissements.title')}</h4>
      <ul className={styles.etablissementList}>
        {etablissements.map((etab) => (
          <li key={etab.numeroUai} className={styles.etablissementRow}>
            <span className={styles.etablissementName}>
              <span className="ri-map-pin-2-line fr-mr-1w" aria-hidden="true" />
              {etablissementLabel(etab)}
            </span>
            <span className="fr-text-mention--grey fr-ml-2w">
              {t('nearbyEtablissements.distance', { distance: distanceFormatter.format(etab.distanceKm) })}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
