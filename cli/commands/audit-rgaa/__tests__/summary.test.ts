import { describe, expect, it } from 'vitest'
import { buildManualCampaigns } from '../summary'
import type { TManualTask } from '../types'

const task = (overrides: Partial<TManualTask> = {}): TManualTask => ({
  pageId: 'accueil',
  pageLabel: "Page d'accueil",
  criterion: '3.1',
  criterionTitle: "L'information ne doit pas être donnée uniquement par la couleur",
  level: 'A',
  topic: '3. Couleurs',
  reason: 'Non évalué automatiquement',
  methodology: '3.1.1 — …',
  tooling: 'VoiceOver + WAVE',
  ...overrides,
})

describe('buildManualCampaigns', () => {
  it('regroupe les contrôles par critère sans en perdre un seul', () => {
    const tasks = [
      task(),
      task({ pageId: 'recherche', pageLabel: 'Recherche de logement' }),
      task({ criterion: '9.4', topic: '9. Structuration' }),
    ]

    const campaigns = buildManualCampaigns(tasks)

    expect(campaigns).toHaveLength(2)
    expect(campaigns.reduce((sum, campaign) => sum + campaign.pages.length, 0)).toBe(tasks.length)
    const couleurs = campaigns.find((campaign) => campaign.criterion === '3.1')
    expect(couleurs?.pages).toEqual(["Page d'accueil", 'Recherche de logement'])
  })

  it('dédoublonne les motifs identiques en listant les pages concernées', () => {
    const campaigns = buildManualCampaigns([
      task(),
      task({ pageId: 'recherche', pageLabel: 'Recherche de logement' }),
      task({ pageId: 'fiche-logement', pageLabel: 'Fiche logement', reason: 'Angle mort : carte rendue côté client' }),
    ])

    expect(campaigns[0].reasons).toEqual([
      { reason: 'Non évalué automatiquement', pages: ["Page d'accueil", 'Recherche de logement'] },
      { reason: 'Angle mort : carte rendue côté client', pages: ['Fiche logement'] },
    ])
  })

  it('range les campagnes par outil, puis par numéro de critère et non par ordre alphabétique', () => {
    const campaigns = buildManualCampaigns([
      task({ criterion: '10.9', topic: '10. Présentation', tooling: 'Navigation à la tabulation seule' }),
      task({ criterion: '9.4', topic: '9. Structuration', tooling: 'Navigation à la tabulation seule' }),
      task({ criterion: '3.1', tooling: 'Navigation à la tabulation seule' }),
    ])

    expect(campaigns.map((campaign) => campaign.criterion)).toEqual(['3.1', '9.4', '10.9'])
  })

  it('ne produit aucune campagne quand tout est statué', () => {
    expect(buildManualCampaigns([])).toEqual([])
  })
})
