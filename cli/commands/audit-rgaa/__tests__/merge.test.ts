import { describe, expect, it } from 'vitest'
import type { TAutoResult } from '../analyzers'
import { mergeSheet } from '../merge'
import type { TCriterion } from '../referential'
import type { TAuditPage, TRgaaFinding } from '../types'

const criteria: TCriterion[] = [
  {
    number: '1.1',
    topicNumber: 1,
    topic: 'Images',
    title: 'Alternative textuelle ?',
    tests: { '1.1.1': '…' },
    level: 'A',
    wcag: ['1.1.1 (A)'],
  },
  { number: '9.1', topicNumber: 9, topic: 'Structuration', title: 'Titres ?', tests: { '9.1.1': '…' }, level: 'A', wcag: ['1.3.1 (A)'] },
]

const page: TAuditPage = {
  id: 'test',
  sheetName: 'Test',
  label: 'Page de test',
  urls: [{ scope: 'test', path: '/', assertContains: [] }],
  auth: false,
  clientOnlyWidgets: [],
  isTemplate: false,
}

const finding = (overrides: Partial<TRgaaFinding> = {}): TRgaaFinding => ({
  criterion: '1.1',
  status: 'NC',
  priority: 'P1',
  observation: 'Constat expert',
  remediation: 'Résolution experte',
  ...overrides,
})

const merge = (autoResults: TAutoResult[], expertFindings: TRgaaFinding[] = [], templateFindings: TRgaaFinding[] = []) =>
  mergeSheet({ page, criteria, autoResults, expertFindings, templateFindings })

describe('mergeSheet', () => {
  it('place toute case non couverte en « à vérifier manuellement », jamais vide', () => {
    const { sheet } = merge([])
    expect(sheet.cells).toHaveLength(2)
    for (const cell of sheet.cells) {
      expect(cell.status).toBe('NT')
      expect(cell.origin).toBe('non testé')
      expect(cell.observations.join('')).not.toBe('')
    }
  })

  it("laisse la couche automatique conclure « conforme » lorsqu'elle couvre tous les tests", () => {
    const { sheet } = merge([{ criterion: '1.1', status: 'C', observation: 'ok', fullyCovered: true }])
    expect(sheet.cells[0]).toMatchObject({ status: 'C', origin: 'automatique', fullyCovered: true })
  })

  it('fait primer le constat expert sur le résultat automatique', () => {
    const { sheet } = merge([{ criterion: '1.1', status: 'NA', observation: 'aucune image', fullyCovered: false }], [finding()])
    expect(sheet.cells[0]).toMatchObject({ status: 'NC', origin: 'automatique + expert', priority: 'P1' })
    expect(sheet.cells[0].remediations).toContain('Résolution experte')
  })

  it("refuse qu'un constat expert déclare conforme un critère condamné automatiquement, sans motif", () => {
    expect(() =>
      merge(
        [{ criterion: '1.1', status: 'NC', observation: 'image sans alt', fullyCovered: false }],
        [finding({ status: 'C', priority: undefined, remediation: undefined })],
      ),
    ).toThrow(/overrides\.reason/)
  })

  it('accepte la promotion en conforme lorsque le motif est explicite', () => {
    const { sheet } = merge(
      [{ criterion: '1.1', status: 'NC', observation: 'image sans alt', fullyCovered: false }],
      [finding({ status: 'C', priority: undefined, remediation: undefined, overrides: { reason: 'faux positif vérifié au rendu' } })],
    )
    expect(sheet.cells[0].status).toBe('C')
  })

  it('signale un constat expert devenu obsolète', () => {
    const { warnings } = merge([{ criterion: '1.1', status: 'C', observation: 'ok', fullyCovered: true }], [finding()])
    expect(warnings.join(' ')).toMatch(/obsolète/)
  })

  it('propage les constats du gabarit dans les feuilles page, mais pas dans le gabarit lui-même', () => {
    const templateFinding = finding({ criterion: '9.1', observation: 'Défaut de gabarit' })

    const propagated = merge([], [], [templateFinding])
    expect(propagated.sheet.cells[1].observations.join(' ')).toContain('[gabarit]')

    const templatePage = { ...page, isTemplate: true }
    const notPropagated = mergeSheet({
      page: templatePage,
      criteria,
      autoResults: [],
      expertFindings: [],
      templateFindings: [templateFinding],
    })
    expect(notPropagated.sheet.cells[1].status).toBe('NT')
  })

  it("refuse qu'un constat du gabarit condamne une page où l'objet visé est absent", () => {
    expect(() => merge([{ criterion: '1.1', status: 'NA', observation: 'aucune image', fullyCovered: false }], [], [finding()])).toThrow(
      /non applicable/,
    )
  })

  it('accepte le constat du gabarit sur un critère non applicable lorsque le motif est explicite', () => {
    const { sheet } = merge(
      [{ criterion: '1.1', status: 'NA', observation: 'aucune image', fullyCovered: false }],
      [],
      [finding({ overrides: { reason: 'défaut présent sur toutes les pages, hors DOM collecté' } })],
    )
    expect(sheet.cells[0].status).toBe('NC')
  })

  it('signale, sans bloquer, un constat de page qui aggrave un critère jugé non applicable', () => {
    const { sheet, warnings } = merge([{ criterion: '1.1', status: 'NA', observation: 'aucune image', fullyCovered: false }], [finding()])
    expect(sheet.cells[0].status).toBe('NC')
    expect(warnings.join(' ')).toMatch(/non applicable/)
  })

  it('laisse passer un constat du gabarit « à vérifier » sur un critère non applicable, en le signalant', () => {
    const notTested = finding({ status: 'NT', priority: undefined, remediation: undefined })
    const { sheet, warnings } = merge(
      [{ criterion: '1.1', status: 'NA', observation: 'aucune image', fullyCovered: false }],
      [],
      [notTested],
    )
    expect(sheet.cells[0].status).toBe('NT')
    expect(warnings.join(' ')).toMatch(/non applicable/)
  })

  it('ne conserve une priorité que sur les constats non conformes', () => {
    const { sheet } = merge([], [finding({ status: 'NA', priority: undefined, remediation: undefined, observation: 'sans objet' })])
    expect(sheet.cells[0].priority).toBeUndefined()
  })
})
