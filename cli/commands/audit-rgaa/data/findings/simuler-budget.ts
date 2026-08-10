import type { TRgaaFinding } from '../../types'

export const findings: TRgaaFinding[] = [
  {
    criterion: '3.1',
    status: 'NT',
    location: 'src/components/budget-simulation/expenses-pie-chart.tsx',
    observation:
      "L'association d'une part du camembert à son poste de dépense repose toujours sur la couleur, mais l'information elle-même — poste, montant, part du budget — est désormais donnée en texte : légende visible sous le graphique, et tableau de données équivalent pour les technologies d'assistance. Reste à juger au rendu si la seule légende suffit, ou s'il faut doubler la couleur d'un motif sur chaque part.",
    tests: ['3.1.1'],
  },
]
