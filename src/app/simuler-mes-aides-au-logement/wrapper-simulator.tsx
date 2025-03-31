'use client'

import { fr } from '@codegouvfr/react-dsfr'
import clsx from 'clsx'
import { FC, useMemo, useState } from 'react'
import AidesSimplifiesSimulator from '~/app/simuler-mes-aides-au-logement/aides-simplifies-simulator'
import styles from './simuler-mes-aides-au-logement.module.css'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import Image from 'next/image'
import homeHero from '~/images/home-bg.webp'
import { useIsMobile } from '~/hooks/use-is-mobile'

export const WrapperSimulator: FC = () => {
  const [simulatorHeight, setSimulatorHeight] = useState<number>(0)
  const computedHeight = useMemo(() => {
    return `${simulatorHeight}px`
  }, [simulatorHeight])

  const isMobile = useIsMobile()
  const containerStyles = isMobile && { height: computedHeight, minHeight: '500px' }
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ ...containerStyles }} className="primaryBackgroundColor">
        <div className={clsx(fr.cx('fr-container'), styles.heroSection)}>
          <DynamicBreadcrumb color="white" />
          <div className={clsx(fr.cx('fr-col-md-4'), styles.heroContent)}>
            <div className={fr.cx('fr-hidden', 'fr-unhidden-md')}>
              <span className={clsx(fr.cx('fr-text--bold'), styles.durationBadge)}>Moins de 3 minutes</span>
            </div>
            <h1 className={styles.heroTitle}>
              Simulez le montant de vos <span className={styles.heroHighlight}>aides au&nbsp;</span>
              <span className={styles.heroHighlight}>logement</span>
            </h1>
            <p className={styles.heroDescription}>
              12 questions pour estimer vos <br /> droits et faciliter vos recherches
            </p>
          </div>
        </div>
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
