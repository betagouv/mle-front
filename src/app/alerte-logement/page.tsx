import Image from 'next/image'
import styles from './alert-logement.module.css'
import findNextAccommodation from '~/images/find-next-accommodation.svg'
import Input from '@codegouvfr/react-dsfr/Input'
import Button from '@codegouvfr/react-dsfr/Button'
import { getTranslations } from 'next-intl/server'

export default async function AlerteLogement() {
  const t = await getTranslations('alertLogement')
  return (
    <div className={styles.container}>
      <Image className={styles.image} src={findNextAccommodation.src} alt="Restez alerté des dernières annonces" width={588} height={459} />
      <div className={styles.cardContainer}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p>{t('subTitle')}</p>
        <Input label="Académie, ville ou département" iconId="ri-map-pin-2-line" />
        <Input
          label="Email"
          nativeInputProps={{
            placeholder: t('emailPlaceholder'),
          }}
          addon={<Button>{t('subscribe')}</Button>}
        />
        <p className={styles.disclaimer}>{t('disclaimer')}</p>
      </div>
    </div>
  )
}
