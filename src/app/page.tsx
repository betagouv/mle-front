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
      <div style={{ backgroundColor: '#5858AD' }}>
        <div className={fr.cx('fr-container')}>
          <div style={{ display: 'flex', paddingTop: '4rem' }}>
            <div style={{ padding: '2rem' }} className={fr.cx('fr-col-md-7')}>
              <h1>
                <span style={{ color: 'white' }}>Trouver votre prochain</span>
                <br />
                <span style={{ color: '#FCC63A' }}>logement étudiant</span>
              </h1>
              <h2 style={{ color: 'white', fontWeight: 'normal' }}>
                et découvrez les <span className={fr.cx('fr-text--bold')}>aides financières</span>
                <br />
                auxquelles vous avez droit.
              </h2>
            </div>
            <div
              style={{
                alignItems: 'center',
                background: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                padding: '2.5rem 3rem',
                textAlign: 'center',
              }}
              className={fr.cx('fr-col-md-5')}
            >
              <h2>Simulez le montant de vos aides au logement</h2>
              <p style={{ margin: '0' }}>et identifiez les aides dont vous pouvez bénéficier d&apos;après votre situation.</p>
              <div style={{ display: 'flex', gap: '1rem', margin: '1rem 0' }}>
                <Image src={apl.src} width={40} height={40} alt="Logo APL" />
                <Image src={caf.src} width={40} height={40} alt="Logo CAF" />
                <Image src={crous.src} width={40} height={40} alt="Logo Crous" />
                <Image src={al.src} width={40} height={40} alt="Logo AL" />
              </div>
              <div style={{ width: '100%' }}>
                <Button style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>Commencer la simulation</Button>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <Image style={{ objectFit: 'cover', width: '100%' }} src={home.src} alt="Hero" width={1449} height={459} />
        </div>
      </div>
      <div
        className={fr.cx('fr-container')}
        style={{
          padding: '4rem 0',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Image src={logo.src} alt="Logo" width={80} height={80} />
          <h1>Tout savoir pour bien se loger</h1>
          <p>
            Estimation, fiches pratiques et aperçu des logements, tout est là pour <br />
            vous guider pas à pas vers votre prochaine vie étudiante.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
          <div style={{ display: 'flex' }}>
            <div
              style={{
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-around',
                padding: '3.5rem 4.5rem',
              }}
            >
              <h2 style={{ margin: 0, textAlign: 'start' }}>Explorer les villes étudiantes</h2>
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
                style={{ height: '100%', width: '100%' }}
                alt="Explorer les villes étudiantes"
                width={300}
                height={540}
              />
            </div>
          </div>
          <div style={{ display: 'flex' }}>
            <div className={fr.cx('fr-col-md-6')}>
              <Image
                src={findNextAccommodation.src}
                style={{ height: '100%', width: '100%' }}
                alt="Trouver votre prochain logement étudiant"
                width={300}
                height={540}
              />
            </div>
            <div
              style={{
                backgroundColor: 'white',
                display: 'flex',
                flexDirection: 'column',
                gap: '1rem',
                justifyContent: 'space-around',
                padding: '3.5rem 4.5rem',
              }}
            >
              <h2 style={{ margin: 0, textAlign: 'start' }}>Trouver son prochain logement étudiant</h2>
              <Input style={{ marginBottom: 0 }} label="Etablissement, académie, ville ou département" iconId="ri-map-pin-2-line" />
              <Range label={t('header.rangeLabel')} max={1000} min={350} hideMinMax step={50} />
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <FindStudentColivingAccomodationSwitch />
                <FindStudentAccessibleAccomodationSwitch />
              </div>
              <Button iconId="ri-search-line" style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                Rechercher
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ backgroundColor: 'white' }}>
        <div className={fr.cx('fr-container')} style={{ padding: '3rem 0' }}>
          <h2 style={{ borderBottom: '1px solid #DDDDDD', paddingBottom: '1rem' }}>Parmi les bailleurs partenaires</h2>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
            <Image src={logo.src} alt="Logo" width={80} height={80} />
          </div>
        </div>
      </div>
      <div className={fr.cx('fr-container')} style={{ padding: '3rem 0' }}>
        <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <h1>Parmi les questions fréquentes</h1>
          <p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt.</p>
          <Tabs
            className={styles.tabs}
            classes={{ panel: styles.backgroundWhite }}
            tabs={[
              {
                content: (
                  <div style={{ background: 'white' }} className={fr.cx('fr-accordions-group')}>
                    <Accordion label="Name of the Accordion 1">Content of the Accordion 1</Accordion>
                    <Accordion label="Name of the Accordion 2">Content of the Accordion 2</Accordion>
                  </div>
                ),
                iconId: 'ri-arrow-right-line',
                label: 'Onglet 1',
              },
              {
                content: (
                  <div style={{ background: 'white' }} className={fr.cx('fr-accordions-group')}>
                    <Accordion label="Name of the Accordion 1">Content of the Accordion 1</Accordion>
                    <Accordion label="Name of the Accordion 2">Content of the Accordion 2</Accordion>
                  </div>
                ),
                iconId: 'ri-arrow-right-line',
                label: 'Onglet 2',
              },
            ]}
          />
        </div>
      </div>
    </>
  )
}
