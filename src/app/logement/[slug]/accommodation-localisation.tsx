import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { getTranslations } from 'next-intl/server'
import AccommodationMap from '~/app/logement/[slug]/accommodation-map'
import styles from './logement.module.css'

type AccommodationLocalisationProps = {
  address: string
  city: string
  latitude: number
  longitude: number
  postalCode: string
}

export const AccommodationLocalisation = async ({ address, city, latitude, longitude, postalCode }: AccommodationLocalisationProps) => {
  const t = await getTranslations('accomodation')
  return (
    <div className={styles.locationContent}>
      <div className={styles.locationInfo}>
        <h4>{t('location.title')}</h4>
        <span>{address}</span>
        <span>
          {postalCode} {city}
        </span>
        <Button iconId="fr-icon-accessibility-line" priority="tertiary" size="small">
          {t('location.accessibility')}
        </Button>
      </div>
      <div style={{ width: '50%' }} className={fr.cx('fr-hidden', 'fr-unhidden-sm')}>
        <AccommodationMap latitude={latitude} longitude={longitude} />
      </div>
    </div>
  )
}
