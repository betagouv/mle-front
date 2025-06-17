import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import { getTranslations } from 'next-intl/server'
import Image from 'next/image'
import { FAQ_CONTENTS } from '~/app/(utils-pages)/faq/page'
import { FaqQuestionsAnswers } from '~/components/faq/faq-questions-answers'
import { FindAccommodationForm } from '~/components/find-student-accomodation/home/find-accommodation-form'
import al from '~/images/al.svg'
import apl from '~/images/apl.svg'
import arpej from '~/images/arpej.svg'
import background from '~/images/background.webp'
import caf from '~/images/caf.svg'
import espacil from '~/images/espacil.svg'
import exploreCities from '~/images/explore-cities.webp'
import home from '~/images/landing.webp'
import crous from '~/images/logo-crous.svg'
import sogima from '~/images/sogima.svg'
import studefi from '~/images/studefi.svg'
import { getPopularCities } from '~/server-only/get-popular-cities'
import styles from './home.module.css'

export default async function Home() {
  const t = await getTranslations('home')
  const popularCities = await getPopularCities()
  const _sortedPopularCities = popularCities.sort((a, b) => b.nb_total_apartments - a.nb_total_apartments).slice(0, 18)

  return (
    <>
      <div className="primaryBackgroundColor">
        <div className={fr.cx('fr-container')}>
          <div className={styles.heroContent}>
            <div className={clsx(fr.cx('fr-col-md-7'), styles.heroTextContainer)}>
              <h1 className={styles.heroTitle}>
                {t('hero.title')} <span className={styles.heroHighlight}>{t('hero.highlight')}</span>
              </h1>
              <h2 className={styles.heroSubtitle}>
                {t.rich('hero.subtitle', {
                  aides: (chunks) => <span className={fr.cx('fr-text--bold')}>{chunks}</span>,
                })}
              </h2>
            </div>
            <div className={clsx(fr.cx('fr-col-md-5'), 'boxShadow', styles.simulatorCard)}>
              <h2>{t('simulator.title')}</h2>
              <p style={{ fontSize: '18px' }}>{t('simulator.description')}</p>
              <div className={styles.logoContainer}>
                <Image src={apl.src} width={40} height={40} alt="Logo APL" />
                <Image src={caf.src} width={40} height={40} alt="Logo CAF" />
                <Image src={crous.src} width={40} height={40} alt="Logo Crous" />
                <Image src={al.src} width={40} height={40} alt="Logo AL" />
              </div>
              <div className={styles.fullWidth}>
                <Button size="large" linkProps={{ href: '/simuler-mes-aides-au-logement' }} className={styles.fullWidthButton}>
                  {t('simulator.button')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <Image className={styles.heroImage} priority quality={100} src={home} alt="Hero" />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image className={clsx(fr.cx('fr-hidden-sm'), styles.heroImageMobile)} priority quality={100} src={home} alt="Hero" />
        </div>
      </div>
      <div className={clsx(fr.cx('fr-container'), styles.mainContainer)}>
        <div className={clsx(fr.cx('fr-container'), styles.headerSection)}>
          <h1 className={styles.headerSectionTitle}>{t('mainSection.title')}</h1>
          <p style={{ fontSize: '18px' }}>
            {t.rich('mainSection.description', {
              part1: (chunks) => <>{chunks}</>,
              part2: (chunks) => (
                <>
                  <br />
                  {chunks}
                </>
              ),
            })}
          </p>
        </div>
        <div className={styles.featuresContainer}>
          <div className={clsx('boxShadow', styles.featureCard)}>
            <div className={styles.cardContent}>
              <div>
                <h1 className={styles.cardTitle}>{t('features.prepareBudget.title')}</h1>
                <p className="fr-text--lg">{t('features.prepareBudget.description')}</p>
              </div>
              <Button size="large" linkProps={{ href: '/preparer-sa-vie-etudiante' }}>
                {t('features.prepareBudget.button')}
              </Button>
              {/* <div className={styles.citiesGrid}>
                {sortedPopularCities.map((city) => (
                  <Button
                    className={styles.cityButton}
                    linkProps={{ href: `/preparer-sa-vie-etudiante/${city.slug}` }}
                    key={city.id}
                    priority="secondary"
                  >
                    {city.name}
                  </Button>
                ))}
                <div className={styles.moreContainer}>
                  <Button
                    priority="secondary"
                    linkProps={{ href: `/preparer-sa-vie-etudiante` }}
                    iconPosition="right"
                    iconId="fr-icon-arrow-right-line"
                  >
                    {t('features.exploreCities.moreButton')}
                  </Button>
                </div> 
              </div>*/}
            </div>
            <div className={fr.cx('fr-col-md-6')}>
              <Image src={exploreCities} className={styles.featureImage} alt="Préparer son budget étudiant" priority quality={100} />
            </div>
          </div>
          {/* <div className={clsx('boxShadow', styles.featureCard)}>
            <div className={styles.cardContent}>
              <h1 className={styles.cardTitle}>{t('features.exploreCities.title')}</h1>
              <div className={styles.citiesGrid}>
                {sortedPopularCities.map((city) => (
                  <Button
                    className={styles.cityButton}
                    linkProps={{ href: `/preparer-sa-vie-etudiante/${city.slug}` }}
                    key={city.id}
                    priority="secondary"
                  >
                    {city.name}
                  </Button>
                ))}
                <div className={styles.moreContainer}>
                  <Button
                    priority="secondary"
                    linkProps={{ href: `/preparer-sa-vie-etudiante` }}
                    iconPosition="right"
                    iconId="fr-icon-arrow-right-line"
                  >
                    {t('features.exploreCities.moreButton')}
                  </Button>
                </div>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-6')}>
              <Image src={exploreCities} className={styles.featureImage} alt="Explorer les villes étudiantes" priority quality={100} />
            </div>
          </div> */}
          <div className={clsx('boxShadow', styles.featureCard)}>
            <div className={fr.cx('fr-col-md-6')}>
              <Image
                src={background}
                className={clsx(fr.cx('fr-hidden', 'fr-unhidden-sm'), styles.featureImage)}
                quality={100}
                alt="Trouver votre prochain logement étudiant"
              />
            </div>
            <div className={styles.cardContent}>
              <h1 className={styles.cardTitle}>{t('features.findAccommodation.title')}</h1>
              <FindAccommodationForm />
            </div>
            <Image
              src={background}
              className={clsx(fr.cx('fr-hidden-sm'), styles.featureImage)}
              quality={100}
              alt="Trouver votre prochain logement étudiant"
            />
          </div>
        </div>
      </div>
      <div className={styles.partnersSection}>
        <div className={fr.cx('fr-container')}>
          <h2 className={styles.partnersHeader}>{t('partners.title')}</h2>
          <div className={styles.partnersGrid}>
            <Image src={arpej} alt="Logo Arpej" quality={100} width={201} height={90} />
            <Image src={espacil} alt="Logo Espacil" quality={100} width={201} height={90} />
            <Image src={sogima} alt="Logo Sogima" quality={100} width={201} height={90} />
            <Image src={studefi} alt="Logo Studefi" quality={100} width={201} height={90} />
          </div>
        </div>
      </div>
      <div className={clsx(fr.cx('fr-container'), styles.faqContainer)}>
        <div className={styles.faqContent}>
          <div>
            <h1 className={styles.faqHeader}>{t('faq.title')}</h1>
          </div>

          <FaqQuestionsAnswers contents={FAQ_CONTENTS.slice(0, 5)} />

          <Button size="large" priority="secondary" linkProps={{ href: '/faq' }}>
            {t('faq.button')}
          </Button>
        </div>
      </div>
    </>
  )
}
