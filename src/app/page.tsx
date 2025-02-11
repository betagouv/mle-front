import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import Image from 'next/image'
import apl from '~/images/apl.svg'
import caf from '~/images/caf.svg'
import crous from '~/images/logo-crous.svg'
import al from '~/images/al.svg'
import logo from '~/images/logo.svg'
import home from '~/images/landing.webp'
import exploreCities from '~/images/explore-cities.webp'
import findNextAccommodation from '~/images/find-next-accommodation.webp'
import styles from './home.module.css'
import Input from '@codegouvfr/react-dsfr/Input'
import Range from '@codegouvfr/react-dsfr/Range'
import { getTranslations } from 'next-intl/server'
import { FindStudentColivingAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-coliving-accomodation'
import { FindStudentAccessibleAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-accessible-accomodation-switch'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import clsx from 'clsx'
import { getPopularCities } from '~/server-only/get-popular-cities'

export default async function Home() {
  const t = await getTranslations('home')
  const popularCities = await getPopularCities()
  const sortedPopularCities = popularCities.sort((a, b) => b.nb_accommodations - a.nb_accommodations).slice(0, 18)

  return (
    <>
      <div className="primaryBackgroundColor">
        <div className={fr.cx('fr-container')}>
          <div className={styles.heroContent}>
            <div className={clsx(fr.cx('fr-col-md-7'), styles.heroTextContainer)}>
              <h1 className={styles.heroTitle}>{t('hero.title')}</h1>
              <h1 className={styles.heroHighlight}>{t('hero.highlight')}</h1>
              <h3 className={styles.heroSubtitle}>
                {t.rich('hero.subtitle', {
                  aides: (chunks) => <span className={fr.cx('fr-text--bold')}>{chunks}</span>,
                })}
              </h3>
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
                <Button size="large" className={styles.fullWidthButton}>
                  {t('simulator.button')}
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <Image className={styles.heroImage} priority quality={100} src={home} alt="Hero" />
        </div>
      </div>
      <div className={clsx(fr.cx('fr-container'), styles.mainContainer)}>
        <div className={styles.headerSection}>
          <Image src={logo.src} alt="Logo" width={80} height={80} />
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
              <h1 className={styles.cardTitle}>{t('features.exploreCities.title')}</h1>
              <div className={styles.citiesGrid}>
                {sortedPopularCities.map((city) => (
                  <Button className={styles.cityButton} key={city.id} priority="secondary">
                    {city.name}
                  </Button>
                ))}
                <div className={styles.moreContainer}>
                  <Button priority="secondary" iconPosition="right" iconId="fr-icon-arrow-right-line">
                    {t('features.exploreCities.moreButton')}
                  </Button>
                </div>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-6')}>
              <Image src={exploreCities} className={styles.featureImage} alt="Explorer les villes étudiantes" priority quality={100} />
            </div>
          </div>
          <div className={clsx('boxShadow', styles.featureCard)}>
            <div className={fr.cx('fr-col-md-6')}>
              <Image
                src={findNextAccommodation}
                className={clsx(fr.cx('fr-hidden', 'fr-unhidden-sm'), styles.featureImage)}
                quality={100}
                alt="Trouver votre prochain logement étudiant"
              />
            </div>
            <div className={styles.cardContent}>
              <h1 className={styles.cardTitle}>{t('features.findAccommodation.title')}</h1>
              <Input label={t('features.findAccommodation.locationInput')} iconId="ri-map-pin-2-line" />
              <Range label={t('header.rangeLabel')} max={1000} min={350} hideMinMax step={50} />
              <div className={styles.switchContainer}>
                <FindStudentColivingAccomodationSwitch />
                <FindStudentAccessibleAccomodationSwitch />
              </div>
              <Button size="large" iconId="ri-search-line" className={styles.searchButton}>
                {t('features.findAccommodation.searchButton')}
              </Button>
            </div>
            <Image
              src={findNextAccommodation}
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
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
          </div>
        </div>
      </div>
      <div className={clsx(fr.cx('fr-container'), styles.faqContainer)}>
        <div className={styles.faqContent}>
          <div>
            <h1 className={styles.faqHeader}>{t('faq.title')}</h1>
            <p className={styles.faqDescription}>{t('faq.description')}</p>
          </div>
          <Tabs
            className={styles.tabs}
            classes={{ panel: styles.backgroundWhite }}
            tabs={[
              {
                content: (
                  <div className={clsx(fr.cx('fr-accordions-group'), styles.accordionContainer)}>
                    <Accordion label={t('faq.accordions.title1')}>{t('faq.accordions.content1')}</Accordion>
                    <Accordion label={t('faq.accordions.title2')}>{t('faq.accordions.content2')}</Accordion>
                  </div>
                ),
                iconId: 'ri-arrow-right-line',
                label: t('faq.tabs.tab1'),
              },
              {
                content: (
                  <div className={clsx(fr.cx('fr-accordions-group'), styles.accordionContainer)}>
                    <Accordion label={t('faq.accordions.title1')}>{t('faq.accordions.content1')}</Accordion>
                    <Accordion label={t('faq.accordions.title2')}>{t('faq.accordions.content2')}</Accordion>
                  </div>
                ),
                iconId: 'ri-arrow-right-line',
                label: t('faq.tabs.tab2'),
              },
            ]}
          />
          <Button size="large" priority="secondary">
            {t('faq.button')}
          </Button>
        </div>
      </div>
    </>
  )
}
