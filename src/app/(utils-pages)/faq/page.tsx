import { fr } from '@codegouvfr/react-dsfr'
import clsx from 'clsx'
import { getTranslations } from 'next-intl/server'
import { FaqQuestionsAnswers } from '~/components/faq/faq-questions-answers'
import { DynamicBreadcrumb } from '~/components/ui/breadcrumb'
import { TFaqQuestionsAnswers } from '~/schemas/faq/faq-questions-answers'
import styles from './faq.module.css'

export const FAQ_CONTENTS: TFaqQuestionsAnswers[] = [
  {
    question: 'Quels types de logements sont accessibles aux étudiants ?',
    answer: (
      <>
        <p>Plusieurs options s'offrent à vous :</p>
        <ul>
          <li>
            <p className={fr.cx('fr-m-0')}>
              <span className={fr.cx('fr-text--bold')}>Résidences universitaires conventionnées ou à vocation sociale</span>&nbsp;:
              réservées aux: réservées aux étudiants, elles proposent des loyers encadrés, souvent inférieurs aux prix du marché. L’accès
              est priorisé pour les étudiants aux revenus modestes (ex. : boursiers du Crous).
            </p>
            <p className={styles.italic}>Inclut : résidences Crous, logements gérés par des associations ou bailleurs sociaux.</p>
          </li>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>Résidences services étudiantes</span>&nbsp;: également réservées aux étudiants, mais
              avec des loyers non encadrés.
            </p>
          </li>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>Location classique</span>&nbsp;: logement indépendant loué auprès d’un particulier ou
              via une agence.
            </p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>
              <span className={fr.cx('fr-text--bold')}>Logement chez l’habitant ou intergénérationnel</span>&nbsp;: chambre louée dans un
              logement occupé, souvent avec des loyers réduits.
            </p>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Comment comprendre les typologies de logement (T1, T2, studio, etc.) ?',
    answer: (
      <>
        <ul>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>Studio</span>&nbsp;: une seule pièce à vivre avec une pièce d’eau (salle de bain/WC).
            </p>
          </li>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>T1</span>&nbsp;: une pièce à vivre + une cuisine séparée + salle de bain/WC.
            </p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>
              <span className={fr.cx('fr-text--bold')}>T2, T3...</span>&nbsp;: chaque chiffre supplémentaire correspond à une pièce en plus
              (ex. : un T2 comprend un salon et une chambre).
            </p>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Que signifie “loyer charges comprises” ?',
    answer: (
      <>
        <p>Si une annonce indique "cc" (charges comprises), cela signifie que certaines charges sont incluses dans le loyer, comme :</p>
        <ul>
          <li>
            <p>L'entretien des parties communes </p>
          </li>
          <li>
            <p>L'eau froide/chaude, voir l'électricité</p>
          </li>
        </ul>
        <p className={clsx(styles.italic, fr.cx('fr-m-0'))}>⚠️ Vérifiez toujours précisément ce que couvrent les charges avant de signer.</p>
      </>
    ),
  },
  {
    question: 'Quelle est la différence entre un logement meublé et non meublé ?',
    answer: (
      <>
        <ul>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>Meublé</span>&nbsp;: contient un équipement minimum (lit, plaques de cuisson, frigo,
              vaisselle, etc.). Les loyers sont généralement plus élevés.
            </p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>
              <span className={fr.cx('fr-text--bold')}>Non meublé</span>&nbsp;: vide ou partiellement équipé, avec un bail souvent plus long
              (3 ans contre 1 an pour un meublé).
            </p>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Qu’est-ce que le DPE et le GES ? Pourquoi est-ce important ?',
    answer: (
      <>
        <ul>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>DPE (Diagnostic de performance énergétique)</span>&nbsp;: indique la consommation
              énergétique du logement (note de A à G).
            </p>
          </li>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>GES (Gaz à effet de serre) </span>&nbsp;: mesure les émissions liées à l’énergie
              utilisée.
            </p>
          </li>
        </ul>
        <p className={clsx(styles.italic, fr.cx('fr-m-0'))}>
          👉 Un logement mal noté (E à G) peut être mal isolé, coûteux à chauffer et inconfortable en été.
        </p>
      </>
    ),
  },
  {
    question: 'Où puis-je trouver ce type de logement étudiant ?',
    answer: (
      <p className={fr.cx('fr-m-0')}>
        Les résidences universitaires conventionnées et autres logements sociaux sont listés dans la section "Trouver un logement étudiant"
        sur monlogementetudiant.beta.gouv.fr
      </p>
    ),
  },
  {
    question: 'Quelles aides financières puis-je obtenir pour payer mon loyer ?',
    answer: (
      <>
        <p>Plusieurs dispositifs peuvent vous aider à alléger le coût du logement :</p>
        <ul>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>APL (Aide Personnalisée au Logement)</span>&nbsp;: versée par la CAF selon vos
              ressources, le type de logement et le loyer.
            </p>
          </li>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>ALS (Allocation de Logement Sociale)</span>&nbsp;: si vous n'êtes pas éligible à
              l'APL.
            </p>
          </li>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>FSL (Fonds de solidarité pour le logement) </span>&nbsp;: aide ponctuelle en cas de
              difficultés.
            </p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>
              <span className={fr.cx('fr-text--bold')}>Aides locales</span>&nbsp;: certaines régions ou villes proposent des aides
              spécifiques (renseignez-vous auprès de votre mairie ou région).
            </p>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Ai-je besoin d’un garant pour louer un logement ?',
    answer: (
      <>
        <p>
          Oui, la majorité des bailleurs exigent un garant : une personne (souvent un parent) qui s’engage à payer le loyer si vous ne le
          pouvez pas. Si vous n'en avez pas, vous pouvez faire appel à :
        </p>
        <ul>
          <li>
            <p>
              <span className={fr.cx('fr-text--bold')}>La grantie Visale</span>&nbsp;(gratuite et publique)
            </p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>
              <span className={fr.cx('fr-text--bold')}>Des garanties privées payantes</span>&nbsp;: proposées par certaines plateformes de
              location.
            </p>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Quels documents dois-je fournir pour constituer un dossier de location ?',
    answer: (
      <>
        <p>Un dossier type comprend généralement :</p>
        <ul>
          <li>
            <p>Une pièce d'identité</p>
          </li>
          <li>
            <p>Un justificatif de situation étudiante (certificat de scolarité)</p>
          </li>
          <li>
            <p>Les trois dernières quittances de loyer ou une attestation d’hébergement</p>
          </li>
          <li>
            <p>Un justificatif de ressources (ou ceux du garant)</p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>Le contrat de travail ou une attestation de bourse, si applicable</p>
          </li>
        </ul>
      </>
    ),
  },
  {
    question: 'Que dois-je vérifier avant de signer un bail ?',
    answer: (
      <>
        <p>Avant de vous engager, pensez à vérifier :</p>
        <ul>
          <li>
            <p>L'état des lieux d'entrée</p>
          </li>
          <li>
            <p>Ce qui couvre exactement les charges</p>
          </li>
          <li>
            <p>La durée du bail et les modalités de résiliation</p>
          </li>
          <li>
            <p>La conformité du logement (surface minimale, équipements obligatoires pour un meublé, etc.)</p>
          </li>
          <li>
            <p className={fr.cx('fr-m-0')}>L’existence d’une clause de solidarité si vous êtes en colocation</p>
          </li>
        </ul>
      </>
    ),
  },
]

export default async function Faq() {
  const t = await getTranslations('faq')

  return (
    <div className={clsx(styles.faqContainer, fr.cx('fr-container'))}>
      <DynamicBreadcrumb margin={false} />
      <h1 style={{ margin: 0 }}>{t('title')}</h1>
      <div className={styles.descriptionContainer}>
        <p className={styles.description}>{t('subTitle')}</p>
      </div>
      <div className={fr.cx('fr-pb-3w')}>
        <div className={styles.titleContainer}>
          <h2 className={styles.title}>{t('popularQuestions')}</h2>
          <hr className={styles.border} />
        </div>
        <FaqQuestionsAnswers />
      </div>
    </div>
  )
}
