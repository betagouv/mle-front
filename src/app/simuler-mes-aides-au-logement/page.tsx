import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import Image from 'next/image'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import homeHero from '~/images/home-bg.svg'
import styles from './simuler-mes-aides-au-logement.module.css'
import Accordion from '@codegouvfr/react-dsfr/Accordion'
import Stepper from '@codegouvfr/react-dsfr/Stepper'

export default function SimulateAccommodationAids() {
  const qa = [
    {
      answer:
        "Le simulateur d'aides au logement pour étudiants est un outil en ligne qui vous permet de simuler le montant de vos aides au logement en fonction de vos revenus, de votre situation familiale et de votre situation géographique.",
      question: "Comment fonctionne le simulateur d'aides au logement pour étudiants ?",
    },
    {
      answer:
        'Sit ea Lorem officia enim ut veniam exercitation aliqua tempor aliqua laborum. Quis elit nostrud tempor occaecat proident nisi irure consequat minim qui aute elit officia. Duis deserunt officia dolor duis nulla amet adipisicing velit nostrud anim culpa. Occaecat occaecat exercitation culpa velit quis reprehenderit amet excepteur tempor elit. Enim quis aliqua duis eu pariatur excepteur voluptate fugiat sint aliquip minim eiusmod Lorem qui. Consectetur in anim veniam mollit occaecat ullamco anim deserunt do do.',
      question: "Quelles informations dois-je fournir pour utiliser le simulateur d'aides au logement ?",
    },
    {
      answer:
        'Sit ea Lorem officia enim ut veniam exercitation aliqua tempor aliqua laborum. Quis elit nostrud tempor occaecat proident nisi irure consequat minim qui aute elit officia. Duis deserunt officia dolor duis nulla amet adipisicing velit nostrud anim culpa. Occaecat occaecat exercitation culpa velit quis reprehenderit amet excepteur tempor elit. Enim quis aliqua duis eu pariatur excepteur voluptate fugiat sint aliquip minim eiusmod Lorem qui. Consectetur in anim veniam mollit occaecat ullamco anim deserunt do do.',
      question: 'Qui est éligible aux aides au logement étudiant en France ?',
    },
    {
      answer:
        'Sit ea Lorem officia enim ut veniam exercitation aliqua tempor aliqua laborum. Quis elit nostrud tempor occaecat proident nisi irure consequat minim qui aute elit officia. Duis deserunt officia dolor duis nulla amet adipisicing velit nostrud anim culpa. Occaecat occaecat exercitation culpa velit quis reprehenderit amet excepteur tempor elit. Enim quis aliqua duis eu pariatur excepteur voluptate fugiat sint aliquip minim eiusmod Lorem qui. Consectetur in anim veniam mollit occaecat ullamco anim deserunt do do.',
      question: 'Puis-je utiliser le simulateur pour tous les types de logements étudiants ?',
    },
    {
      answer:
        'Sit ea Lorem officia enim ut veniam exercitation aliqua tempor aliqua laborum. Quis elit nostrud tempor occaecat proident nisi irure consequat minim qui aute elit officia. Duis deserunt officia dolor duis nulla amet adipisicing velit nostrud anim culpa. Occaecat occaecat exercitation culpa velit quis reprehenderit amet excepteur tempor elit. Enim quis aliqua duis eu pariatur excepteur voluptate fugiat sint aliquip minim eiusmod Lorem qui. Consectetur in anim veniam mollit occaecat ullamco anim deserunt do do.',
      question: 'Que faire si les résultats du simulateur semblent incorrects ?',
    },
  ]
  return (
    <>
      <div style={{ position: 'relative' }}>
        <div style={{ backgroundColor: '#5858AD', paddingBottom: '3.5rem', paddingLeft: '3.5rem', paddingRight: '3.5rem' }}>
          <div className={fr.cx('fr-container')}>
            <DynamicBreadcrumb color="white" />
            <div className={fr.cx('fr-col-md-4')} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <span
                  className={fr.cx('fr-text--bold')}
                  style={{
                    backgroundColor: '#FEE7FC',
                    borderRadius: '4px',
                    color: '#6E445A',
                    paddingLeft: '0.5rem',
                    paddingRight: '0.5rem',
                  }}
                >
                  Moins de 3 minutes
                </span>
              </div>
              <h1 style={{ color: 'white', margin: 0 }}>
                Simulez le <br />
                montant de <br />
                vos <span style={{ color: '#FCC63A' }}>aides au</span>
                <br />
                <span style={{ color: '#FCC63A' }}>logement</span>
              </h1>
              <p style={{ color: 'white', margin: 0 }}>
                12 questions pour estimer vos <br /> droits et faciliter vos recherches
              </p>
            </div>
          </div>
        </div>

        <div style={{ lineHeight: 0 }}>
          <Image
            src={homeHero.src}
            priority
            alt="Image de la page d'accueil"
            width={1000}
            height={600}
            style={{
              objectFit: 'cover',
              width: '100%',
            }}
          />
        </div>

        <div className={fr.cx('fr-container')} style={{ left: '50%', position: 'absolute', top: '3rem', transform: 'translateX(-50%)' }}>
          <div style={{ backgroundColor: 'white', marginLeft: 'auto' }} className={fr.cx('fr-col-md-8')}>
            <div
              style={{
                boxShadow: '0 4px 12px -4px rgba(0, 0, 18, 0.16)',
                paddingBottom: '1.5rem',
                paddingLeft: '3.5rem',
                paddingRight: '3.5rem',
                paddingTop: '1.5rem',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Stepper currentStep={1} nextTitle="Mon foyer" style={{ margin: 0 }} stepCount={4} title="Mon profil" />
            </div>
            <div style={{ padding: '3.5rem' }}>
              <h2>Confirmez votre statut d&apos;étudiant</h2>

              <p style={{ margin: 0 }}>
                Ipsum occaecat ut tempor mollit velit ea. Et ipsum in do elit officia nisi. Irure aliqua cupidatat amet ipsum eu enim
                excepteur elit magna do magna proident velit laborum. Cillum sit incididunt sit minim pariatur aliquip aute exercitation
                nostrud officia ipsum et dolore excepteur enim. Proident dolor eu qui sint nisi esse. Tempor in exercitation sunt ullamco
                ipsum eiusmod incididunt irure consectetur ut exercitation commodo voluptate elit. Do cillum ut consequat proident occaecat
                id ullamco velit commodo anim. Do velit do irure ex velit dolor occaecat elit excepteur et dolore enim sit non.
              </p>
              <div style={{ border: 'solid 0.5px #ddd', marginBottom: '2rem', marginTop: '2rem' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button priority="secondary" disabled iconId="ri-arrow-left-line">
                  Retour
                </Button>
                <Button iconId="ri-arrow-right-line" iconPosition="right">
                  Continuer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: '#5858AD', padding: '3.5rem' }}>
        <div className={fr.cx('fr-container')}>
          <div style={{ display: 'flex' }} className={fr.cx('fr-col-md-12')}>
            <div className={fr.cx('fr-col-md-4')}>
              <h3 style={{ color: 'white' }}>
                Parmi les questions fréquentes sur les <br />
                aides aux logements étudiants
              </h3>
              <Button iconId="ri-question-line" className={styles.whiteButton} priority="secondary">
                Foire aux questions
              </Button>
            </div>
            <div className={fr.cx('fr-col-md-8')}>
              <div style={{ background: 'white', padding: '2rem' }} className={fr.cx('fr-accordions-group')}>
                {qa.map((qa, index) => (
                  <Accordion key={index} label={qa.question}>
                    <p>{qa.answer}</p>
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
