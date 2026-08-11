import { describe, expect, it } from 'vitest'
import { computeTypologyDiff, type TypologySnapshot } from './typology-diff'

const t = (over: Partial<TypologySnapshot> = {}): TypologySnapshot => ({
  type: 't1',
  nbTotal: 10,
  nbAvailable: 5,
  priceMin: 400,
  priceMax: 600,
  superficieMin: 15,
  superficieMax: 25,
  colocation: false,
  ...over,
})

describe('computeTypologyDiff', () => {
  it('ne signale rien quand rien ne change', () => {
    expect(computeTypologyDiff([t()], [t()])).toEqual({})
  })

  it('signale une disponibilité modifiée — le cas perdu depuis le 21/07/2026', () => {
    const diff = computeTypologyDiff([t({ nbAvailable: 5 })], [t({ nbAvailable: 2 })])

    expect(diff).toEqual({ 'typologies.t1.nbAvailable': { old: 5, new: 2 } })
  })

  it('signale surfaces et loyers', () => {
    const diff = computeTypologyDiff([t()], [t({ superficieMin: 18, priceMax: 650 })])

    expect(diff).toEqual({
      'typologies.t1.priceMax': { old: 600, new: 650 },
      'typologies.t1.superficieMin': { old: 15, new: 18 },
    })
  })

  it('traite null et undefined comme une même absence', () => {
    expect(computeTypologyDiff([t({ superficieMin: null })], [t({ superficieMin: undefined })])).toEqual({})
  })

  it('signale le passage d’une valeur à une absence, et l’inverse', () => {
    expect(computeTypologyDiff([t({ nbAvailable: 3 })], [t({ nbAvailable: null })])).toEqual({
      'typologies.t1.nbAvailable': { old: 3, new: null },
    })
    expect(computeTypologyDiff([t({ nbAvailable: null })], [t({ nbAvailable: 3 })])).toEqual({
      'typologies.t1.nbAvailable': { old: null, new: 3 },
    })
  })

  it('ne confond pas 0 et absence', () => {
    expect(computeTypologyDiff([t({ nbAvailable: 0 })], [t({ nbAvailable: null })])).toEqual({
      'typologies.t1.nbAvailable': { old: 0, new: null },
    })
  })

  it('signale une typologie ajoutée, avec sa présence et ses champs', () => {
    const diff = computeTypologyDiff([t()], [t(), t({ type: 't3', nbTotal: 4, nbAvailable: 1 })])

    expect(diff['typologies.t3.present']).toEqual({ old: false, new: true })
    expect(diff['typologies.t3.nbTotal']).toEqual({ old: null, new: 4 })
  })

  it('signale une typologie supprimée', () => {
    const diff = computeTypologyDiff([t(), t({ type: 't3' })], [t()])

    expect(diff['typologies.t3.present']).toEqual({ old: true, new: false })
    expect(diff['typologies.t3.nbTotal']).toEqual({ old: 10, new: null })
  })

  it('signale la présence même quand la typologie supprimée était entièrement vide', () => {
    // Sans la clé `present`, une typologie fantôme disparaîtrait du journal sans laisser de trace.
    const vide: TypologySnapshot = { type: 't4' }
    const diff = computeTypologyDiff([vide], [])

    expect(diff).toEqual({ 'typologies.t4.present': { old: true, new: false } })
  })

  it('signale un changement de colocation', () => {
    expect(computeTypologyDiff([t({ colocation: false })], [t({ colocation: true })])).toEqual({
      'typologies.t1.colocation': { old: false, new: true },
    })
  })

  it('gère plusieurs typologies en une passe', () => {
    const before = [t(), t({ type: 't2', nbAvailable: 8 })]
    const after = [t({ nbAvailable: 1 }), t({ type: 't2', nbAvailable: 0 })]

    expect(computeTypologyDiff(before, after)).toEqual({
      'typologies.t1.nbAvailable': { old: 5, new: 1 },
      'typologies.t2.nbAvailable': { old: 8, new: 0 },
    })
  })
})
