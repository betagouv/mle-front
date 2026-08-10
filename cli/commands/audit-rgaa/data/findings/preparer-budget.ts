import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '8.6',
    status: 'C',
    location: 'messages/fr.json et messages/en.json (metadata.prepareBudget.title)',
    observation:
      "Le titre annonçait « Calculer son budget étudiant » sur une page de conseils éditoriaux, décrivant ainsi la fonctionnalité de l'autre page budget, le simulateur. Il annonce désormais « Préparer son budget étudiant : conseils pratiques », en accord avec le <h1> et le contenu de la page.",
    tests: ['8.6.1'],
  },
]
