'use client'

import { fr } from '@codegouvfr/react-dsfr'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { FC, useMemo, useState } from 'react'
import AidesSimplifiesSimulator from '~/app/simuler-mes-aides-au-logement/aides-simplifies-simulator'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import homeHero from '~/images/home-bg.webp'
import styles from './simuler-mes-aides-au-logement.module.css'

const WrapperHeaderSimulator: FC = () => {
  const t = useTranslations('simulator')
  return (
    <div className={clsx(fr.cx('fr-container'), styles.heroSection)}>
      <DynamicBreadcrumb color="white" />
      <div className={clsx(fr.cx('fr-col-md-4'), styles.heroContent)}>
        <h1 className={styles.heroTitle}>
          {t('titlePart1')} <span className={styles.heroHighlight}>{t('titlePart2')}&nbsp;</span>
          <span className={styles.heroHighlight}>{t('titlePart3')}</span>
        </h1>
        <p className={styles.heroDescription}>
          {t('descriptionPart1')} <br /> {t('descriptionPart2')}
        </p>
      </div>
    </div>
  )
}

export const WrapperSimulator: FC = () => {
  const [simulatorHeight, setSimulatorHeight] = useState<number>(0)
  const computedHeight = useMemo(() => {
    return `${simulatorHeight}px`
  }, [simulatorHeight])

  const containerStyles = { height: computedHeight, minHeight: computedHeight }
  return (
    <div style={{ position: 'relative' }}>
      <div style={containerStyles} className={clsx('primaryBackgroundColor', fr.cx('fr-hidden', 'fr-unhidden-md'))}>
        <WrapperHeaderSimulator />
      </div>
      <div className={clsx('primaryBackgroundColor', fr.cx('fr-hidden-sm'))}>
        <WrapperHeaderSimulator />
      </div>

      <div className={clsx(styles.imageWrapper, 'fr-hidden', 'fr-unhidden-md')}>
        <Image src={homeHero} priority alt="Image de la page d'accueil" quality={100} className={styles.heroImage} />
      </div>
      <div className={clsx('fr-container', styles.formContainer)}>
        <div className={clsx(fr.cx('fr-col-md-8'), styles.formContent)}>
          <AidesSimplifiesSimulator onHeightChange={setSimulatorHeight} />
        </div>
      </div>
      <div className={clsx(styles.imageWrapper, 'fr-hidden-sm')}>
        <Image src={homeHero} priority alt="Image de la page d'accueil" quality={100} className={styles.heroImage} />
      </div>
    </div>
  )
}
