import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '9.1',
    status: 'NT',
    location: 'src/app/(public)/simuler-mes-aides-au-logement/page.tsx',
    observation:
      'Le contenu éditorial des questions/réponses est désormais sanitisé côté serveur (routeur tRPC questionsAnswers.getGlobal) par sanitizeEditorialHTML, dont la liste blanche exclut les balises hx : le plan de la page ne dépend plus de la saisie en base. Reste à vérifier au rendu que les contenus publiés restent complets après sanitisation.',
    tests: ['9.1.1'],
  },
  {
    criterion: '7.5',
    status: 'NT',
    location: 'src/components/helps-simulator/help-simulator-form.tsx',
    observation:
      "Le changement d'étape déplace maintenant le focus sur le titre de la nouvelle étape et l'annonce dans une région live ; une soumission invalide affiche un résumé d'erreurs en role=\"alert\" qui reçoit le focus. Reste à vérifier au lecteur d'écran que l'enchaînement annonce / focus est correctement restitué, et que le résumé ne double pas les messages posés sous chaque champ.",
    tests: ['7.5.1', '7.5.2'],
  },
  {
    criterion: '11.1',
    status: 'C',
    location: 'Relevé - champs, feuille du run ; help-simulator-step-1.tsx',
    observation:
      'Les champs des cinq étapes ont été repris dans le cahier de relevés. Deux familles y apparaissaient sans étiquette : les curseurs de montant et les cases « Quel est votre statut ? ». Le balisage réel les dément — chaque curseur porte aria-labelledby vers un <label class="fr-label"> visible qui l\'annonce (« Montant de votre loyer mensuel », avec son hint), et chaque case est enveloppée dans un <label> contenant son intitulé, étiquetage implicite valide. Tous les autres champs portent une étiquette explicite. La colonne vide du relevé venait de l\'extracteur, qui ne résolvait pas aria-labelledby.',
    tests: ['11.1.1', '11.1.2', '11.1.3'],
  },
]
