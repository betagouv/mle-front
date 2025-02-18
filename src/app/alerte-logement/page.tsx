import Image from 'next/image'
import styles from './alert-logement.module.css'
import findNextAccommodation from '~/images/find-next-accommodation.webp'
import { getTranslations } from 'next-intl/server'
import { AlertAccommodationForm } from '~/components/alert-accommodation/alert-accommodation-form'

export default async function AlerteLogement() {
  const t = await getTranslations('alertLogement')
  return (
    <div className={styles.container}>
      <Image src={findNextAccommodation} alt="Restez alerté des dernières annonces" priority quality={100} />
      <div className={styles.cardContainer}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p>{t('subTitle')}</p>
        <AlertAccommodationForm />
      </div>
    </div>
  )
}
