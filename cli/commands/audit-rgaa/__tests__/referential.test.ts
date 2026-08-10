import { describe, expect, it } from 'vitest'
import { loadExpertFindings } from '../data/findings'
import { CRITERIA_COUNT, compareCriteria, loadReferential, stripMarkdown } from '../referential'
import { computeRates } from '../summary'
import type { TAuditSheet } from '../types'

const referential = loadReferential('docs/audit-rgaa/referentiel')

describe('référentiel figé', () => {
  it('contient les 106 critères du RGAA 4.1', () => {
    expect(referential.criteria).toHaveLength(CRITERIA_COUNT)
  })

  it('répartit les niveaux en 83 A et 23 AA, sans AAA', () => {
    const counts = referential.criteria.reduce<Record<string, number>>((acc, criterion) => {
      acc[criterion.level] = (acc[criterion.level] ?? 0) + 1
      return acc
    }, {})
    expect(counts).toEqual({ A: 83, AA: 23 })
  })

  it('trie les critères numériquement et non lexicographiquement', () => {
    expect(compareCriteria('2.1', '10.1')).toBeLessThan(0)
    expect(compareCriteria('9.4', '10.1')).toBeLessThan(0)
    const numbers = referential.criteria.map((criterion) => criterion.number)
    expect(numbers.indexOf('2.1')).toBeLessThan(numbers.indexOf('10.1'))
  })

  it('fournit une méthodologie pour chaque test de chaque critère', () => {
    const missing = referential.criteria.flatMap((criterion) =>
      Object.keys(criterion.tests).filter((testNumber) => !referential.methodologies[testNumber]),
    )
    expect(missing).toEqual([])
  })

  it('nettoie le markdown des intitulés', () => {
    expect(stripMarkdown('Chaque [image](#img) a-t-elle une `alternative` ?')).toBe('Chaque image a-t-elle une alternative ?')
  })
})

describe('constats experts', () => {
  it('ne référence que des critères existants et respecte les règles de saisie', () => {
    const knownCriteria = new Set(referential.criteria.map((criterion) => criterion.number))
    expect(() => loadExpertFindings(knownCriteria)).not.toThrow()
  })

  it('rejette un critère inconnu', () => {
    expect(() => loadExpertFindings(new Set(['1.1']))).toThrow(/inexistant/)
  })
})

describe('taux de conformité', () => {
  const sheet = (pageId: string, isTemplate: boolean, statuses: string[]): TAuditSheet => ({
    pageId,
    sheetName: pageId,
    label: pageId,
    isTemplate,
    cells: statuses.map((status, index) => ({
      criterion: `1.${index + 1}`,
      status: status as 'C' | 'NC' | 'NA' | 'NT',
      origin: 'automatique',
      observations: ['x'],
      remediations: [],
      fullyCovered: false,
    })),
  })

  it('calcule les trois indicateurs et exclut la feuille de gabarit', () => {
    const rates = computeRates([sheet('page', false, ['C', 'C', 'NC', 'NA', 'NT']), sheet('gabarit', true, ['NC'])], 10)

    expect(rates).toHaveLength(1)
    expect(rates[0].provisional).toBeCloseTo(2 / 3)
    expect(rates[0].floor).toBeCloseTo(2 / 4)
    expect(rates[0].coverage).toBeCloseTo(4 / 10)
  })
})
