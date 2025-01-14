import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Image from 'next/image'
import avatarCecilia from '~/images/avatar-cecilia.svg'
import landingHero from '~/images/landing.svg'
import landingStep1 from '~/images/landing-step-1.svg'
import landingStep2 from '~/images/landing-step-2.svg'
import visibilityAvatar from '~/images/visibility.svg'
import logo from '~/images/logo.svg'
import apl from '~/images/apl.svg'
import caf from '~/images/caf.svg'
import crous from '~/images/logo-crous.svg'
import al from '~/images/al.svg'
import enseignementSup from '~/images/ministere-enseignement-sup.svg'
import poingFerme from '~/images/poing-ferme.svg'
import styles from './landing.module.css'

export default function LandingPage() {
  return (
    <>
      <div>
        <div className={styles.heroSection}>
          <div className={fr.cx('fr-container')}>
            <div className={styles.heroContent}>
              <div className={`${fr.cx('fr-col-md-8')} ${styles.heroTextContent}`}>
                <h1 className={styles.heroTitle}>
                  Connectons les acteurs <br /> du
                  <span className={styles.highlight}> logement étudiant</span>
                </h1>
                <p className={styles.heroDescription}>
                  <span className={styles.bold}>Mon logement étudiant</span> centralise les offres de logements sociaux des différents
                  bailleurs. La plateforme intègre également un <span className={styles.bold}>simulateur d&apos;aides financières</span>,
                  permettant à chaque étudiant d&apos;estimer son futur budget selon son prochain lieu de vie.
                </p>
                <div className={styles.contactSection}>
                  <div className={styles.profileInfo}>
                    <Image src={avatarCecilia.src} alt="Chargée de déploiement - Cécilia Foret" width={56} height={56} />
                    <div className={styles.profileText}>
                      <p>Cécilia Foret</p>
                      <p>Chargée de déploiement de Mon Logement Etudiant</p>
                    </div>
                  </div>
                  <div className={styles.contactButton}>
                    <Button className={'whiteButton'} priority="secondary">
                      Contacter
                    </Button>
                  </div>
                </div>
              </div>
              <Image src={landingHero.src} width={720} height={560} quality={100} priority alt="Image de la landing page" />
            </div>
          </div>
        </div>

        <div className={`${fr.cx('fr-container')} ${styles.mainSection}`}>
          <h1 className={styles.mainTitle}>
            Accéder à un logement ne devrait <br /> jamais être un obstacle à la réussite.
          </h1>
          <div className={styles.featuresContainer}>
            <div className={`${fr.cx('fr-col-md-4')} ${styles.featureCard}`}>
              <div className={styles.featureImageContainer}>
                <Image src={visibilityAvatar.src} width={288} height={268} quality={100} priority alt="Gagnez en visibilité" />
              </div>
              <h4>Gagnez en visibilité</h4>
              <span>
                Centralisez vos offres sur une plateforme officielle, soutenue par des relais de communication ciblés pour toucher un
                maximum d&apos;étudiants. Une intégration rapide de vos données, permettant de rediriger les étudiants directement sur votre
                site. <span style={{ fontWeight: 'bold' }}>Et c&apos;est gratuit.</span>
              </span>
            </div>

            <div className={styles.rightFeatures}>
              <div className={styles.topFeatureCard}>
                <div className={styles.featureContent}>
                  <h4>Un étudiant, un logement.</h4>
                  <span>
                    La plateforme accompagne les étudiants à identifier les aides disponibles et à évaluer le coût de la vie des différentes
                    villes étudiantes. Le service simplifie également la recherche de studios ou colocations disponibles.
                  </span>
                </div>
                <Image src={logo.src} width={120} height={120} quality={100} priority alt="Logo Mon Logement Etudiant" />
              </div>

              <div className={styles.bottomFeatures}>
                <div className={styles.impactCard}>
                  <h4>Impact social renforcé</h4>
                  <span>
                    En rejoignant ce projet, vous affirmez votre engagement pour faciliter l&apos;accès au logement et soutenir les
                    étudiants précaires dans leur parcours.
                  </span>
                  <div className={styles.poingContainer}>
                    <Image src={poingFerme.src} width={400} height={300} alt="Logo poing fermé" />
                  </div>
                </div>

                <div className={styles.initiativeCard}>
                  <div>
                    <h4>Une initiative soutenue et encouragée</h4>
                    <span>Mon Logement Etudiant est déployé dans le cadre de la lutte contre la précarité étudiante.</span>
                  </div>
                  <Image src={enseignementSup.src} width={178} height={120} alt="Logo de l'enseignement supérieur" />
                </div>
              </div>
            </div>
          </div>
        </div>
        <h2 style={{ margin: 0, marginBottom: '8rem', textAlign: 'center' }}>
          Notre mission: <br />
          faciliter la recherche de <br />
          logement d&apos;un étudiant
        </h2>

        <div className={fr.cx('fr-container')} style={{ marginTop: '4rem' }}>
          <div style={{ display: 'flex', position: 'relative' }}>
            <div className={styles.verticalLine}>
              <div className={styles.circleTop}></div>
              <div className={styles.circleBottom}></div>
            </div>
            <div className={fr.cx('fr-col-md-6')} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ backgroundColor: '#5858AD', height: '450px' }}>
                <Image src={landingStep1.src} width={574} height={450} alt="Étape 1 - Je simule mes aides au logement"></Image>
              </div>
              <div
                style={{
                  backgroundColor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  height: '450px',
                  justifyContent: 'center',
                  padding: '4.5rem 4rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#5757AD',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0px 0.5rem',
                    width: 'fit-content',
                  }}
                >
                  Étape 2
                </div>
                <h2>Je prépare ma vie étudiante</h2>
                <p style={{ margin: 0 }}>Tout ce qu’il faut savoir sur sa prochaine ville étudiante et son marché locatif.</p>
                <span className={fr.cx('ri-community-line')}>Informations pratiques</span>
                <span className={fr.cx('ri-line-chart-line')}>Pression locative</span>
                <span className={fr.cx('ri-money-dollar-circle-line')}>Prix moyen des loyers</span>
                <span className={fr.cx('ri-shopping-bag-line')}>Coût de la vie étudiante</span>
              </div>
              <div style={{ backgroundColor: '#5858AD', height: '450px', overflowY: 'hidden' }}>
                <Image
                  src={landingStep1.src}
                  style={{ width: '100%' }}
                  width={574}
                  height={450}
                  alt="Étape 2 - Je simule mes aides au logement"
                ></Image>
              </div>
            </div>
            <div className={fr.cx('fr-col-md-6')} style={{ display: 'flex', flexDirection: 'column' }}>
              <div
                style={{
                  backgroundColor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  height: '450px',
                  justifyContent: 'center',
                  padding: '4.5rem 7.5rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#5757AD',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0px 0.5rem',
                    width: 'fit-content',
                  }}
                >
                  Étape 1
                </div>
                <h2>Je simule mes aides au logement</h2>
                <p>
                  En quelques clics, l&apos;étudiant identifie ses droits aux différentes aides disponibles et obtient des informations
                  claires sur les démarches à réaliser.
                </p>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <Image src={apl.src} width={30} height={30} alt="Logo APL" />
                  <Image src={caf.src} width={30} height={30} alt="Logo CAF" />
                  <Image src={crous.src} width={30} height={30} alt="Logo Crous" />
                  <Image src={al.src} width={30} height={30} alt="Logo AL" />
                  <span>Plus de 50 organismes</span>
                </div>
              </div>

              <div style={{ backgroundColor: '#5858AD', height: '450px' }}>
                <Image
                  src={landingStep2.src}
                  width={574}
                  height={450}
                  style={{ width: '100%' }}
                  alt="Étape 2 - Je prépare ma vie étudiante"
                ></Image>
              </div>
              <div
                style={{
                  backgroundColor: 'white',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  height: '450px',
                  justifyContent: 'center',
                  padding: '4.5rem 7.5rem',
                }}
              >
                <div
                  style={{
                    backgroundColor: '#5757AD',
                    borderRadius: '0.25rem',
                    color: 'white',
                    fontWeight: 'bold',
                    padding: '0px 0.5rem',
                    width: 'fit-content',
                  }}
                >
                  Étape 3
                </div>
                <h2>Je trouve un logement étudiant</h2>
                <p>
                  Une recherche efficace grâce aux filtres personnalisés (localisation, budget, type de logement, accès PMR, etc.). La fiche
                  détaillée présente la résidence en détails en incitant à consulter la page de destination de votre choix.
                </p>
              </div>
            </div>
          </div>

          <div className={fr.cx('fr-container')} style={{ display: 'flex', flexDirection: 'column', gap: '2rem', padding: '4rem 0rem' }}>
            <h2 style={{ margin: 0, marginTop: '4rem', textAlign: 'center' }}>
              C&apos;est aussi simple que ça.
              <br />
              On vous intègre ?
            </h2>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Button iconPosition="right" iconId="ri-arrow-right-fill">
                Prendre rendez-vous
              </Button>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Image src={avatarCecilia.src} alt="Chargée de déploiement - Cécilia Foret" width={56} height={56} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: 'bold', margin: 0 }}>Cécilia Foret</p>
                <p style={{ margin: 0 }}>Chargée de déploiement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
