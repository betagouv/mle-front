import { describe, expect, it } from 'vitest'
import { haversineMeters, lambert93ToWgs84, parseRamseseCoordonnees } from './geo'

describe('haversineMeters', () => {
  it('renvoie 0 pour deux points identiques', () => {
    expect(haversineMeters({ lat: 48.8566, lng: 2.3522 }, { lat: 48.8566, lng: 2.3522 })).toBe(0)
  })

  it('approxime la distance Paris ↔ Créteil (~11 km)', () => {
    const paris = { lat: 48.8566, lng: 2.3522 }
    const creteil = { lat: 48.7904, lng: 2.4556 }
    const meters = haversineMeters(paris, creteil)
    expect(meters).toBeGreaterThan(10_000)
    expect(meters).toBeLessThan(12_000)
  })

  it('approxime la distance Paris ↔ Lyon (~392 km)', () => {
    const meters = haversineMeters({ lat: 48.8566, lng: 2.3522 }, { lat: 45.764, lng: 4.8357 })
    expect(meters / 1000).toBeGreaterThan(385)
    expect(meters / 1000).toBeLessThan(400)
  })
})

describe('lambert93ToWgs84', () => {
  it('reprojette un point parisien Lambert 93 vers ~2.35, 48.85', () => {
    const { lat, lng } = lambert93ToWgs84(652089, 6862305)
    expect(lng).toBeCloseTo(2.35, 1)
    expect(lat).toBeCloseTo(48.86, 1)
  })
})

describe('parseRamseseCoordonnees', () => {
  it('interprète WGS84 comme x=lng, y=lat sans reprojection', () => {
    const result = parseRamseseCoordonnees({ x: '2.3522', y: '48.8566', systemeReference: 'WGS84' })
    expect(result).toEqual({ lat: 48.8566, lng: 2.3522 })
  })

  it('reprojette Lambert 93 par défaut (systemeReference absent)', () => {
    const result = parseRamseseCoordonnees({ x: '652089', y: '6862305', systemeReference: null })
    expect(result?.lng).toBeCloseTo(2.35, 1)
    expect(result?.lat).toBeCloseTo(48.86, 1)
  })

  it('reprojette quand systemeReference mentionne Lambert', () => {
    const result = parseRamseseCoordonnees({ x: '652089', y: '6862305', systemeReference: 'LAMBERT_93' })
    expect(result?.lat).toBeCloseTo(48.86, 1)
  })

  it('renvoie null si x/y non numériques', () => {
    expect(parseRamseseCoordonnees({ x: '', y: '', systemeReference: 'WGS84' })).toBeNull()
    expect(parseRamseseCoordonnees({ x: 'abc', y: '48.8', systemeReference: 'WGS84' })).toBeNull()
  })
})
