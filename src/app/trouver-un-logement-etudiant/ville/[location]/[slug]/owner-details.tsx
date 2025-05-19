import Button from '@codegouvfr/react-dsfr/Button'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { TAccomodationDetails } from '~/schemas/accommodations/accommodations'
import styles from './logement.module.css'

interface OwnerDetailsProps {
  nbTotalApartments: number | null
  owner: TAccomodationDetails['owner']
  externalUrl: string | undefined
}

export const OwnerDetails = async ({ nbTotalApartments, owner, externalUrl }: OwnerDetailsProps) => {
  const t = await getTranslations('accomodation')
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
          {!!owner.image_base64 && <Image src={owner.image_base64} alt={owner.name} width={201} height={90} quality={100} />}

          <h3 className={styles.sidebarText}>{owner.name}</h3>
          {!!owner.url && (
            <Button linkProps={{ href: externalUrl ?? owner.url }} priority="primary">
              {t('sidebar.buttons.consult')}
            </Button>
          )}
        </div>
      )}
      <div className={styles.sidebarShare}>
        <p className={styles.sidebarText}>{t('sidebar.share')}</p>
        <div className={styles.buttonGroup}>
          <Button size="small" iconId="ri-links-line" priority="tertiary" title={t('sidebar.buttons.link')} />
          <Button size="small" iconId="ri-mail-line" priority="tertiary" title={t('sidebar.buttons.email')} />
          <Button size="small" iconId="ri-printer-line" priority="tertiary" title={t('sidebar.buttons.print')} />
        </div>
      </div>
    </div>
  )
}
