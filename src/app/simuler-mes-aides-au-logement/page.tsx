import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import Image from 'next/image'
import homeHero from '~/images/home-bg.webp'
import styles from './simuler-mes-aides-au-logement.module.css'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import { getGlobalQuestionsAnswers } from '~/server-only/get-global-questions-answers'
import { clsx } from 'clsx'
import AidesSimplifiesSimulator from '~/app/simuler-mes-aides-au-logement/aides-simplifies-simulator'

export default async function SimulateAccommodationAids() {
  const qa = await getGlobalQuestionsAnswers()
  return (
    <>
      <div style={{ position: 'relative' }}>
        <div className="primaryBackgroundColor">
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
            <AidesSimplifiesSimulator />
          </div>
        </div>
        <div className={clsx(styles.imageWrapper, 'fr-hidden-sm')}>
          <Image src={homeHero} priority alt="Image de la page d'accueil" quality={100} className={styles.heroImage} />
        </div>
      </div>

      <div className={clsx('primaryBackgroundColor', styles.faqSection)}>
        <div className={fr.cx('fr-container')}>
          <div className={clsx('fr-col-md-12', styles.faqContainer)}>
            <div className={clsx(fr.cx('fr-col-md-4'), styles.faqTitleContainer)}>
              <h2 className={styles.faqTitle}>
                Parmi les questions fréquentes sur les <br />
                aides aux logements étudiants
              </h2>
              <div className={styles.faqButtonContainer}>
                <Button iconId="ri-question-line" className="whiteButton" priority="secondary">
                  Foire aux questions
                </Button>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-8')}>
              <div className={clsx(fr.cx('fr-accordions-group'), styles.faqContent)}>
                {qa.map((qa, index) => (
                  <Accordion key={index} label={qa.title_fr}>
                    <div dangerouslySetInnerHTML={{ __html: qa.content_fr }} />
                  </Accordion>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
