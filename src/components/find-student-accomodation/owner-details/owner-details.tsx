import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { OwnerDetailsActions } from '~/components/find-student-accomodation/owner-details/owner-details-actions'
import { TAccomodationDetails } from '~/schemas/accommodations/accommodations'
import styles from './owner-details.module.css'

interface OwnerDetailsProps {
  nbTotalApartments: number | null
  owner: TAccomodationDetails['owner']
  externalUrl: string | undefined
  title: string
  location: string
}

export const OwnerDetails = async ({ nbTotalApartments, owner, externalUrl, title, location }: OwnerDetailsProps) => {
  const t = await getTranslations('accomodation')
  const ownerUrl = externalUrl || owner?.url
  return (
    <div className={styles.sidebarCard}>
      {nbTotalApartments ? (
        <h3 className={styles.sidebarTitle}>{t('sidebar.accommodationsCount', { count: nbTotalApartments })}</h3>
      ) : (
        <h3 className={styles.sidebarTitle}>{t('sidebar.accommodationsNoCount')}</h3>
      )}
      {!!owner && (
        <div className={styles.sidebarOwner}>
          <span>{t('sidebar.proposedBy')}</span>
          {owner.image_base64 ? (
            <Image src={owner.image_base64} alt={owner.name} width={201} height={90} quality={100} />
          ) : (
            <h3 className={fr.cx('fr-m-0')}>{owner.name}</h3>
          )}
          {!!ownerUrl && (
            <>
              <span className={fr.cx('fr-text--sm', 'fr-m-0')}>{t('sidebar.hasAvailableAccommodation')}</span>
              <Button linkProps={{ href: ownerUrl }} priority="primary" size="large">
                {t('sidebar.buttons.consult')}
              </Button>
            </>
          )}
        </div>
      )}
      <OwnerDetailsActions title={title} location={location} />
    </div>
  )
}
