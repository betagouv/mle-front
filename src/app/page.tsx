import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import Image from 'next/image'
import apl from '~/images/apl.svg'
import caf from '~/images/caf.svg'
import crous from '~/images/logo-crous.svg'
import al from '~/images/al.svg'
import home from '~/images/home.svg'
import logo from '~/images/logo.svg'
import exploreCities from '~/images/explore-cities.svg'
import findNextAccommodation from '~/images/find-next-accommodation.svg'
import styles from './home.module.css'
import Input from '@codegouvfr/react-dsfr/Input'
import Range from '@codegouvfr/react-dsfr/Range'
import { getTranslations } from 'next-intl/server'
import { FindStudentColivingAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-coliving-accomodation'
import { FindStudentAccessibleAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-accessible-accomodation-switch'
import Tabs from '@codegouvfr/react-dsfr/Tabs'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import clsx from 'clsx'

export default async function Home() {
  const t = await getTranslations('findAccomodation')
  // TODO - get popular cities
  const cities = [
    'Paris',
    'Lyon',
    'Toulouse',
    'Montpellier',
    'Lille',
    'Nice',
    'Bordeaux',
    'Grenoble',
    'Nantes',
    'Strasbourg',
    'Rennes',
    'Marseille',
    'Angers',
    'Créteil',
    'Clermont-Ferrand',
  ]
  return (
    <>
      <div className={styles.heroSection}>
        <div className={fr.cx('fr-container')}>
          <div className={styles.heroContent}>
            <div className={clsx(fr.cx('fr-col-md-7'), styles.heroTextContainer)}>
              <h1 className={styles.heroTitle}>Trouver votre prochain</h1>
              <h1 className={styles.heroHighlight}>logement étudiant</h1>
              <h3 className={styles.heroSubtitle}>
                et découvrez les <span className={fr.cx('fr-text--bold')}>aides financières </span>
                auxquelles vous avez droit.
              </h3>
            </div>
            <div className={clsx(fr.cx('fr-col-md-5'), 'boxShadow', styles.simulatorCard)}>
              <h2>Simulez le montant de vos aides au logement</h2>
              <p className={styles.noMargin}>et identifiez les aides dont vous pouvez bénéficier d&apos;après votre situation.</p>
              <div className={styles.logoContainer}>
                <Image src={apl.src} width={40} height={40} alt="Logo APL" />
                <Image src={caf.src} width={40} height={40} alt="Logo CAF" />
                <Image src={crous.src} width={40} height={40} alt="Logo Crous" />
                <Image src={al.src} width={40} height={40} alt="Logo AL" />
              </div>
              <div className={styles.fullWidth}>
                <Button className={styles.fullWidthButton}>Commencer la simulation</Button>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <Image className={styles.heroImage} src={home.src} alt="Hero" width={1449} height={459} />
        </div>
      </div>
      <div className={clsx(fr.cx('fr-container'), styles.mainContainer)}>
        <div className={styles.headerSection}>
          <Image src={logo.src} alt="Logo" width={80} height={80} />
          <h1>Tout savoir pour bien se loger</h1>
          <p>
            Estimation, fiches pratiques et aperçu des logements, tout est là pour <br />
            vous guider pas à pas vers votre prochaine vie étudiante.
          </p>
        </div>
        <div className={styles.featuresContainer}>
          <div className={clsx('boxShadow', styles.featureCard)}>
            <div className={styles.cardContent}>
              <h1 className={styles.cardTitle}>Explorer les villes étudiantes</h1>
              <div className={styles.citiesGrid}>
                {cities.map((city) => (
                  <Button className={styles.cityButton} key={city} priority="secondary">
                    {city}
                  </Button>
                ))}
                <div className={styles.moreContainer}>
                  <Button priority="secondary" iconPosition="right" iconId="fr-icon-arrow-right-line">
                    Plus de villes
                  </Button>
                </div>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-6')}>
              <Image
                src={exploreCities.src}
                className={styles.featureImage}
                alt="Explorer les villes étudiantes"
                width={300}
                height={540}
              />
            </div>
          </div>
          <div className={clsx('boxShadow', styles.featureCard)}>
            <div className={fr.cx('fr-col-md-6')}>
              <Image
                src={findNextAccommodation.src}
                className={styles.featureImage}
                alt="Trouver votre prochain logement étudiant"
                width={300}
                height={540}
              />
            </div>
            <div className={styles.cardContent}>
              <h1 className={styles.cardTitle}>Trouver son prochain logement étudiant</h1>
              <Input label="Etablissement, académie, ville ou département" iconId="ri-map-pin-2-line" />
              <Range label={t('header.rangeLabel')} max={1000} min={350} hideMinMax step={50} />
              <div className={styles.switchContainer}>
                <FindStudentColivingAccomodationSwitch />
                <FindStudentAccessibleAccomodationSwitch />
              </div>
              <Button iconId="ri-search-line" className={styles.searchButton}>
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.partnersSection}>
        <div className={fr.cx('fr-container')}>
          <h2 className={styles.partnersHeader}>Parmi les bailleurs partenaires</h2>
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
            <h1 className={styles.faqHeader}>Parmi les questions fréquentes</h1>
            <p className={styles.faqDescription}>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.</p>
          </div>
          <Tabs
            className={styles.tabs}
            classes={{ panel: styles.backgroundWhite }}
            tabs={[
              {
                content: (
                  <div className={clsx(fr.cx('fr-accordions-group'), styles.accordionContainer)}>
                    <Accordion label="Name of the Accordion 1">Content of the Accordion 1</Accordion>
                    <Accordion label="Name of the Accordion 2">Content of the Accordion 2</Accordion>
                  </div>
                ),
                iconId: 'ri-arrow-right-line',
                label: 'Onglet 1',
              },
              {
                content: (
                  <div className={clsx(fr.cx('fr-accordions-group'), styles.accordionContainer)}>
                    <Accordion label="Name of the Accordion 1">Content of the Accordion 1</Accordion>
                    <Accordion label="Name of the Accordion 2">Content of the Accordion 2</Accordion>
                  </div>
                ),
                iconId: 'ri-arrow-right-line',
                label: 'Onglet 2',
              },
            ]}
          />
          <Button priority="secondary">Foire aux questions</Button>
        </div>
      </div>
    </>
  )
}
