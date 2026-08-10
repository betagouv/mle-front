import type { TAuditPage, TClientOnlyWidget } from './types'

/**
 * Jeu de paramètres complet de l'étape 4 du simulateur d'aides.
 * Sans lui, HelpSimulatorResults renvoie null et la page paraît vide : on auditerait
 * un écran inexistant. Les clés proviennent des parseurs nuqs de use-help-simulator-data.ts.
 */
const AID_RESULT_PARAMS =
  'step=4&age=20&status=student&isInternational=false&year=1&isLicencePro=false&isScholarship=true&city=Nantes&hasChangedRegion=false&hasGuarantor=true&monthlyIncome=400&monthlyRent=500&isRentUnknown=false'

/**
 * Critères que chaque widget rendu côté client empêche de conclure automatiquement.
 * La collecte voit le DOM SSR : Recharts et Leaflet n'y produisent rien.
 * Sans ce verrou, un analyseur conclurait « Non applicable » sur des objets qu'il ne voit pas.
 */
export const BLIND_SPOT_CRITERIA: Record<TClientOnlyWidget, string[]> = {
  'leaflet-map': ['1.1', '1.2', '1.3', '3.2', '3.3', '7.1', '7.3', '11.9', '12.8', '13.11'],
  'recharts-pie': ['1.1', '1.5', '3.1', '3.2', '5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8'],
  'dsfr-modals': ['9.1', '12.8', '12.9', '12.11'],
}

export const BLIND_SPOT_LABELS: Record<TClientOnlyWidget, string> = {
  'leaflet-map': 'carte Leaflet (rendue côté client, absente du HTML serveur)',
  'recharts-pie': 'graphique Recharts (rendu côté client, absent du HTML serveur)',
  'dsfr-modals': 'modales DSFR (présentes dans le DOM mais fermées)',
}

/** Marqueur de la page 404 : `notFound()` répond 200 avec le corps de not-found.tsx. */
export const NOT_FOUND_MARKER = 'Page introuvable'

export const STUDENT_SPACE_SCREENS = [
  { scope: 'tableau de bord', path: '/mon-espace/tableau-de-bord', assertContains: ['Ravi de vous revoir'] },
  { scope: 'favoris', path: '/mon-espace/favoris', assertContains: [] },
  { scope: 'alertes', path: '/mon-espace/alertes', assertContains: [] },
  { scope: 'to-do', path: '/mon-espace/to-do', assertContains: [] },
  { scope: 'aides au logement', path: '/mon-espace/aides-au-logement', assertContains: [] },
  { scope: 'informations personnelles', path: '/mon-espace/informations-personnelles', assertContains: [] },
]

/**
 * Les 8 périmètres du classeur. `accommodationUrl` est injectée à l'exécution :
 * la fiche auditée est choisie par score de richesse (voir sample.ts).
 */
export function buildAuditPages(accommodationUrl: string): TAuditPage[] {
  return [
    {
      id: 'accueil',
      sheetName: 'Accueil',
      label: "Page d'accueil",
      auth: false,
      isTemplate: false,
      clientOnlyWidgets: ['dsfr-modals'],
      urls: [
        { scope: 'fr', path: '/', acceptLanguage: 'fr-FR,fr;q=0.9', assertContains: [] },
        // Deuxième passe : `lang` est résolu depuis Accept-Language, or messages/en.json
        // contient du français. Sans cette collecte, le constat 8.3/8.4 n'est pas reproductible.
        { scope: 'en', path: '/', acceptLanguage: 'en-US,en;q=0.9', assertContains: [] },
      ],
    },
    {
      id: 'recherche',
      sheetName: 'Recherche',
      label: 'Recherche de logement',
      auth: false,
      isTemplate: false,
      clientOnlyWidgets: ['leaflet-map', 'dsfr-modals'],
      urls: [{ scope: 'résultats', path: '/trouver-un-logement-etudiant', assertContains: [] }],
    },
    {
      id: 'fiche-logement',
      sheetName: 'Fiche logement',
      label: 'Fiche logement',
      auth: false,
      isTemplate: false,
      clientOnlyWidgets: ['leaflet-map', 'dsfr-modals'],
      urls: [{ scope: 'fiche', path: accommodationUrl, assertContains: ['Visite virtuelle', 'Équipements'] }],
    },
    {
      id: 'simuler-budget',
      sheetName: 'Calculatrice budget',
      label: 'Calculatrice de budget',
      auth: false,
      isTemplate: false,
      clientOnlyWidgets: ['recharts-pie', 'dsfr-modals'],
      urls: [{ scope: 'calculatrice', path: '/simuler-budget', assertContains: [] }],
    },
    {
      id: 'preparer-budget',
      sheetName: 'Conseils pratiques',
      label: 'Conseils pratiques — préparer mon budget',
      auth: false,
      isTemplate: false,
      clientOnlyWidgets: ['dsfr-modals'],
      urls: [{ scope: 'conseils', path: '/preparer-mon-budget-etudiant', assertContains: [] }],
    },
    {
      id: 'simulateur-aides',
      sheetName: 'Simulateur aides',
      label: "Simulateur d'aides au logement",
      auth: false,
      isTemplate: false,
      clientOnlyWidgets: ['dsfr-modals'],
      urls: [
        { scope: 'étape 1', path: '/simuler-mes-aides-au-logement', assertContains: [] },
        { scope: 'étape 2', path: '/simuler-mes-aides-au-logement?step=2', assertContains: [] },
        { scope: 'étape 3', path: '/simuler-mes-aides-au-logement?step=3', assertContains: [] },
        { scope: 'résultats éligibles', path: `/simuler-mes-aides-au-logement?${AID_RESULT_PARAMS}`, assertContains: [] },
        {
          scope: 'résultats non éligibles',
          path: `/simuler-mes-aides-au-logement?${AID_RESULT_PARAMS}&view=ineligible`,
          assertContains: [],
        },
      ],
    },
    {
      id: 'espace-etudiant',
      sheetName: 'Espace étudiant',
      label: 'Espace étudiant',
      auth: true,
      isTemplate: false,
      clientOnlyWidgets: ['dsfr-modals'],
      urls: STUDENT_SPACE_SCREENS,
    },
    {
      id: 'gabarit',
      sheetName: 'Global - gabarit',
      label: 'Gabarit commun (en-tête, pied de page, navigation, modales)',
      auth: false,
      // Feuille de référence : ses constats sont propagés dans les feuilles page,
      // mais elle est exclue du calcul des taux (ce n'est pas une page de l'échantillon).
      isTemplate: true,
      clientOnlyWidgets: ['dsfr-modals'],
      urls: [
        { scope: 'gabarit', path: '/', assertContains: [] },
        { scope: 'plan du site', path: '/plan-du-site', assertContains: [] },
        // { scope: 'déclaration', path: '/accessibilite', assertContains: [] },
      ],
    },
  ]
}

/**
 * Critères verrouillés en « À vérifier manuellement » pour une page donnée.
 *
 * `observedWidgets` liste les widgets réellement trouvés dans le DOM hydraté par la passe
 * navigateur. Un widget observé n'est plus un angle mort : les analyseurs le voient, le
 * verrou tombe. Les modales font exception — présentes dans le DOM mais fermées, leur
 * contenu reste hors du parcours tant qu'on ne les a pas ouvertes.
 */
const WIDGETS_STILL_BLIND_WHEN_RENDERED: TClientOnlyWidget[] = ['dsfr-modals']

export function blindSpotsFor(page: TAuditPage, observedWidgets?: string[]): Map<string, string[]> {
  const locked = new Map<string, string[]>()
  for (const widget of page.clientOnlyWidgets) {
    const lifted = observedWidgets?.includes(widget) && !WIDGETS_STILL_BLIND_WHEN_RENDERED.includes(widget)
    if (lifted) continue
    for (const criterion of BLIND_SPOT_CRITERIA[widget]) {
      locked.set(criterion, [...(locked.get(criterion) ?? []), BLIND_SPOT_LABELS[widget]])
    }
  }
  return locked
}
