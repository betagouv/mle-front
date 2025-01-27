import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Image from 'next/image'
import avatarCecilia from '~/images/avatar-cecilia.svg'
import landingHero from '~/images/landing.svg'
import visibilityAvatar from '~/images/visibility.svg'
import logo from '~/images/logo.svg'
import poingFerme from '~/images/poing-ferme.svg'
import enseignementSup from '~/images/ministere-enseignement-sup.svg'
import al from '~/images/al.svg'
import landingStep1 from '~/images/landing-step-1.svg'
import landingStep2 from '~/images/landing-step-2.svg'
import landingStep3 from '~/images/landing-step-3.svg'
import apl from '~/images/apl.svg'
import caf from '~/images/caf.svg'
import crous from '~/images/logo-crous.svg'
import styles from './landing.module.css'
import clsx from 'clsx'

export default function LandingPage() {
  return (
    <>
      <div>
        <div className={styles.heroSection}>
          <div className={fr.cx('fr-container')}>
            <div className={styles.heroContent}>
              <div className={clsx(fr.cx('fr-col-md-8'), styles.heroTextContent)}>
                <h1 className={styles.heroTitle}>
                  Connectons les acteurs <br /> du
                  <span className={styles.highlight}> logement étudiant</span>
                </h1>
                <p className={styles.heroDescription}>
                  <span className={styles.bold}>Mon Logement Étudiant</span> centralise les offres de logements sociaux des différents
                  bailleurs. La plateforme intègre également un <span className={styles.bold}>simulateur d&apos;aides financières</span>,
                  permettant à chaque étudiant d&apos;estimer son futur budget selon son prochain lieu de vie.
                </p>
                <div className={styles.contactSection}>
                  <div className={styles.profileInfo}>
                    <Image src={avatarCecilia.src} alt="Chargée de déploiement - Cécilia Foret" width={56} height={56} />
                    <div className={styles.profileText}>
                      <p className={styles.profileName}>Cécilia Foret</p>
                      <p className={styles.profileRole}>Chargée de déploiement de Mon Logement Etudiant</p>
                    </div>
                  </div>
                  <div className={styles.contactButton}>
                    <Button className={'whiteButton'} priority="secondary">
                      <a href="https://calendly.com/cecilia-foret-beta/30min" target="_blank">
                        Contacter
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              <div className={styles.heroImage}>
                <Image src={landingHero.src} width={720} height={560} quality={100} priority alt="Image de la landing page" />
              </div>
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
                  <h4>Notre priorité, les étudiants boursiers.</h4>
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
                  <div className={styles.enseignementSup}>
                    <Image src={enseignementSup.src} width={178} height={120} alt="Logo de l'enseignement supérieur" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <h2 className={styles.missionTitle}>
          Notre mission: <br />
          faciliter la recherche de <br />
          logement d&apos;un étudiant
        </h2>

        <div className={fr.cx('fr-container')}>
          <div className={styles.stepsContainer}>
            <div className={styles.verticalLine}>
              <div className={styles.circleTop}></div>
              <div className={styles.circleBottom}></div>
            </div>
            <div className={`${fr.cx('fr-col-md-6')} ${styles.stepColumn}`}>
              <div className={styles.purpleBox}>
                <Image
                  src={landingStep1.src}
                  className={clsx(styles.stepsImage, styles.firstStepImage)}
                  width={574}
                  height={450}
                  alt="Étape 1 - Je simule mes aides au logement"
                />
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepBadge}>Étape 2</div>
                <h2>Je prépare ma vie étudiante</h2>
                <p className={styles.noMargin}>Tout ce qu&apos;il faut savoir sur sa prochaine ville étudiante et son marché locatif.</p>
                <span className={fr.cx('ri-community-line')}>Informations pratiques</span>
                <span className={fr.cx('ri-line-chart-line')}>Pression locative</span>
                <span className={fr.cx('ri-money-dollar-circle-line')}>Prix moyen des loyers</span>
                <span className={fr.cx('ri-shopping-bag-line')}>Coût de la vie étudiante</span>
              </div>
              <div className={clsx(styles.purpleBox, styles.secondStepImage)}>
                <Image
                  src={landingStep3.src}
                  className={clsx(styles.stepsImage, styles.secondStepImage)}
                  width={574}
                  height={450}
                  alt="Étape 3 - Je trouve un logement étudiant"
                />
              </div>
            </div>
            <div className={clsx(fr.cx('fr-col-md-6'), styles.stepColumn)}>
              <div className={styles.stepContent}>
                <div className={styles.stepBadge}>Étape 1</div>
                <h2>Je simule mes aides au logement</h2>
                <p>
                  En quelques clics, l&apos;étudiant identifie ses droits aux différentes aides disponibles et obtient des informations
                  claires sur les démarches à réaliser.
                </p>
                <div className={styles.logoContainer}>
                  <Image src={apl.src} width={30} height={30} alt="Logo APL" />
                  <Image src={caf.src} width={30} height={30} alt="Logo CAF" />
                  <Image src={crous.src} width={30} height={30} alt="Logo Crous" />
                  <Image src={al.src} width={30} height={30} alt="Logo AL" />
                  <span>Plus de 50 organismes</span>
                </div>
              </div>

              <div className={styles.purpleBox}>
                <Image
                  src={landingStep2.src}
                  width={574}
                  height={450}
                  className={clsx(styles.stepsImage, styles.secondStepImage)}
                  alt="Étape 2 - Je prépare ma vie étudiante"
                />
              </div>
              <div className={styles.stepContent}>
                <div className={styles.stepBadge}>Étape 3</div>
                <h2>Je trouve un logement étudiant</h2>
                <p>
                  Une recherche efficace grâce aux filtres personnalisés (localisation, budget, type de logement, accès PMR, etc.). La fiche
                  détaillée présente la résidence en détails en incitant à consulter la page de destination de votre choix.
                </p>
              </div>
            </div>
          </div>

          <div className={styles.callToAction}>
            <h2 className={styles.callToActionTitle}>
              C&apos;est aussi simple que ça.
              <br />
              On vous intègre ?
            </h2>
            <div className={styles.buttonContainer}>
              <Button>
                <a href="https://calendly.com/cecilia-foret-beta/30min" target="_blank">
                  Prendre rendez-vous
                </a>
              </Button>
            </div>
            <div className={styles.profileContainer}>
              <Image src={avatarCecilia.src} alt="Chargée de déploiement - Cécilia Foret" width={56} height={56} />
              <div className={styles.profileDetails}>
                <p className={styles.profileName}>Cécilia Foret</p>
                <p className={styles.profileRole}>Chargée de déploiement</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
