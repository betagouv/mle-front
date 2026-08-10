import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '7.3',
    status: 'NT',
    scope: 'alertes',
    location: 'src/components/student-space/alerts/student-alert-location.tsx',
    observation:
      "Les trois listes de suggestions (villes, départements, académies) sont aplaties en une seule séquence et suivent le motif ARIA combobox : navigation aux flèches, validation par Entrée, fermeture par Échap, option courante désignée par aria-activedescendant. Reste à vérifier au clavier et au lecteur d'écran sur les trois types de résultats.",
    tests: ['7.3.1'],
  },
  {
    criterion: '1.3',
    status: 'C',
    scope: 'favoris',
    location: 'src/components/find-student-accomodation/card/find-student-accommodation-image-card.tsx',
    observation:
      "Les favoris partagent le composant d'image des cartes de résultat, dont l'alternative dupliquait le titre de la carte. La correction apportée à ce composant vaut ici sans modification propre.",
    tests: ['1.3.1'],
  },
  {
    criterion: '8.6',
    status: 'C',
    location: 'mon-espace/layout.tsx et les six page.tsx de mon-espace/',
    observation:
      "Les six écrans partageaient un unique titre de page, « Espace étudiant - Gestion de votre espace », alors qu'ils occupent six URL distinctes. Le gabarit du layout compose désormais « <intitulé de l'écran> - Espace étudiant » et chaque écran fournit le sien, repris des libellés de fil d'Ariane déjà traduits. Le relevé du run confirme six titres distincts, chacun identifiant sa page.",
    tests: ['8.6.1'],
  },
]
