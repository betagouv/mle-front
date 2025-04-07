import Alert from '@codegouvfr/react-dsfr/Alert'
import { getTranslations } from 'next-intl/server'
import { TAccomodationDetails } from '~/schemas/accommodations/accommodations'
import styles from './logement.module.css'

type AccommodationResidenceProps = {
  accommodation: TAccomodationDetails
}

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
export const AccommodationResidence = async (props: AccommodationResidenceProps) => {
  const t = await getTranslations('accomodation')

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
