import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { TEtablissementSuperieur } from '~/schemas/ramsese/etablissement-superieur'
import { NATURES_ETABLISSEMENTS } from '~/schemas/ramsese/natures'

vi.mock('~/server/services/ramsese', () => ({ getEtablissementsSuperieurByCodePostal: vi.fn() }))

import { getEtablissementsSuperieurByCodePostal } from '~/server/services/ramsese'
import { getNearbyEtablissements } from './get-nearby-etablissements'

const mockRamsese = vi.mocked(getEtablissementsSuperieurByCodePostal)

// Résidence de référence : Créteil.
const RESIDENCE = { codePostal: '94000', lat: 48.7904, lng: 2.4556 }

function etab(numeroUai: string, lng: number | null, lat: number | null): TEtablissementSuperieur {
  return {
    numeroUai,
    denomination: `Etab ${numeroUai}`,
    sigle: null,
    natureCodes: ['523'],
    secteur: 'PU',
    adresse: null,
    codePostal: '94000',
    commune: 'CRETEIL',
    codeInseeCommune: '94028',
    telephone: null,
    email: null,
    coordonnees: lng !== null && lat !== null ? { x: String(lng), y: String(lat), systemeReference: 'WGS84' } : null,
  }
}

describe('getNearbyEtablissements', () => {
  beforeEach(() => {
    mockRamsese.mockReset()
  })

  it('trie par distance croissante et retourne la liste complète', async () => {
    // Longitudes croissantes → distances croissantes depuis la résidence (2.4556).
    mockRamsese.mockResolvedValue([
      etab('F', 2.53, 48.79),
      etab('A', 2.46, 48.79),
      etab('D', 2.5, 48.79),
      etab('B', 2.47, 48.79),
      etab('E', 2.52, 48.79),
      etab('C', 2.48, 48.79),
    ])

    const result = await getNearbyEtablissements(RESIDENCE)

    expect(result.map((e) => e.numeroUai)).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    // distances strictement croissantes
    for (let i = 1; i < result.length; i++) {
      expect(result[i].distanceMeters).toBeGreaterThan(result[i - 1].distanceMeters)
    }
    expect(result[0].distanceKm).toBeCloseTo(result[0].distanceMeters / 1000, 6)
  })

  it('exclut les établissements sans coordonnées', async () => {
    mockRamsese.mockResolvedValue([etab('A', 2.46, 48.79), etab('NO_GEO', null, null), etab('B', 2.47, 48.79)])

    const result = await getNearbyEtablissements(RESIDENCE)

    expect(result.map((e) => e.numeroUai)).toEqual(['A', 'B'])
  })

  it('passe la liste blanche des natures au service RAMSESE', async () => {
    mockRamsese.mockResolvedValue([])

    await getNearbyEtablissements(RESIDENCE)

    expect(mockRamsese).toHaveBeenCalledWith('94000', { natures: [...NATURES_ETABLISSEMENTS] })
  })

  it('retourne [] si code postal vide (aucun appel RAMSESE)', async () => {
    const result = await getNearbyEtablissements({ codePostal: '', lat: 48.79, lng: 2.45 })

    expect(result).toEqual([])
    expect(mockRamsese).not.toHaveBeenCalled()
  })
})
