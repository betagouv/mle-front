import { getTranslations } from 'next-intl/server'
import styles from './login.module.css'
import background from '~/images/background.webp'
import Image from 'next/image'
import { LoginForm } from '~/components/login/login-form'
import Button from '@codegouvfr/react-dsfr/Button'
import { fr } from '@codegouvfr/react-dsfr'
import clsx from 'clsx'

export default async function LoginPage() {
  const t = await getTranslations('login')
  return (
    <div className={clsx(styles.container, fr.cx('fr-container'))}>
      <div className={styles.imageContainer}>
        <Image className={styles.image} src={background} alt="Se connecter" priority quality={100} />
      </div>
      <div className={styles.cardContainer}>
        <h1 className={styles.title}>{t('title')}</h1>
        <p>{t('subTitle')}</p>
        <LoginForm />
        <div className={styles.dividerContainer}>
          <span className={styles.divider}>{t('labels.or')}</span>
        </div>
        <div className={styles.firstVisitContainer}>
          <h2>{t('firstVisit.title')}</h2>
          <p>{t('firstVisit.description')}</p>
          <Button priority="secondary" iconPosition="left" iconId="ri-user-line">
            {t('firstVisit.cta')}
          </Button>
        </div>
      </div>
    </div>
  )
}
