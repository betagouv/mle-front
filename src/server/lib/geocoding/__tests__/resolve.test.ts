import { beforeEach, describe, expect, it, vi } from 'vitest'
import { departmentOf, hasOrphanBoxSuffix, resolveAddressLocation, stripBoxSuffix } from '../resolve'

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
  vi.resetModules()
})

/** Enchaîne la réponse geo.api (communes) puis la réponse BAN (candidats). */
function mockApis(communes: unknown, features: unknown[]) {
  mockFetch
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => communes })
    .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ features }) })
}

function feature(opts: { lng: number; lat: number; city: string; postcode: string; citycode: string; depcode: string; name?: string }) {
  return {
    geometry: { type: 'Point', coordinates: [opts.lng, opts.lat] },
    properties: {
      name: opts.name ?? 'rue',
      label: `${opts.name ?? 'rue'} ${opts.postcode} ${opts.city}`,
      city: opts.city,
      postcode: opts.postcode,
      citycode: opts.citycode,
      depcode: opts.depcode,
    },
  }
}

describe('hasOrphanBoxSuffix', () => {
  it.each([
    '2 rue du Général Delestraint CS',
    '5-7 RUE DES RENARDS BP',
    'Ile du Saulcy CS',
    '11, rue du plat d etain  cs',
  ])('détecte un numéro de boîte tronqué dans « %s »', (address) => {
    expect(hasOrphanBoxSuffix(address)).toBe(true)
  })

  it.each([
    '3 allée Marguerite Yourcenar',
    '26, rue Hippolyte Foucque',
    'Section Morin BP 473',
    '1 rue des CS Blancs',
  ])('ne se déclenche pas sur « %s »', (address) => {
    expect(hasOrphanBoxSuffix(address)).toBe(false)
  })
})

describe('stripBoxSuffix', () => {
  it('retire les suffixes de boîte postale', () => {
    expect(stripBoxSuffix('Section Morin BP 473')).toBe('Section Morin')
    expect(stripBoxSuffix('3 Rue Mademoiselle CS5217')).toBe('3 Rue Mademoiselle')
    expect(stripBoxSuffix('12 rue Pasteur CEDEX 3')).toBe('12 rue Pasteur')
  })

  it('laisse intacte une adresse sans boîte', () => {
    expect(stripBoxSuffix('3 allée Marguerite Yourcenar')).toBe('3 allée Marguerite Yourcenar')
  })
})

describe('departmentOf', () => {
  it('lit le département sur deux chiffres en métropole', () => {
    expect(departmentOf('02100')).toBe('02')
  })

  it('lit le département sur trois chiffres en outre-mer', () => {
    expect(departmentOf('97490')).toBe('974')
    expect(departmentOf('98800')).toBe('988')
  })
})

describe('resolveAddressLocation', () => {
  it('rejette un candidat situé dans une autre commune que celle du code postal', async () => {
    // Cas réel : « allée Marguerite Yourcenar » n'existe pas à Saint-Quentin,
    // la BAN propose Saint-Avertin (37) à 333 km.
    mockApis(
      [{ nom: 'Saint-Quentin', code: '02691', codeDepartement: '02', population: 53000, centre: { coordinates: [3.28745, 49.847398] } }],
      [feature({ lng: 0.743736, lat: 47.364112, city: 'Saint-Avertin', postcode: '37550', citycode: '37208', depcode: '37' })],
    )

    const decision = await resolveAddressLocation({
      address: '3 allée Marguerite Yourcenar',
      postalCode: '02100',
      cityName: 'Saint-Quentin',
    })

    expect(decision.action).toBe('apply')
    if (decision.action !== 'apply') return
    expect(decision.confidence).toBe('commune')
    expect(decision.reason).toBe('street-absent-from-ban')
    expect(decision.lat).toBeCloseTo(49.847398)
    expect(decision.inseeCode).toBe('02691')
  })

  it('retient le candidat dont le code commune appartient au code postal', async () => {
    mockApis(
      [{ nom: 'Orsay', code: '91471', codeDepartement: '91', population: 16000, centre: { coordinates: [2.18, 48.7] } }],
      [
        feature({ lng: 2.29, lat: 48.85, city: 'Paris', postcode: '75015', citycode: '75115', depcode: '75' }),
        feature({ lng: 2.1875, lat: 48.6987, city: 'Orsay', postcode: '91400', citycode: '91471', depcode: '91' }),
      ],
    )

    const decision = await resolveAddressLocation({ address: '2 rue Joliot Curie', postalCode: '91400', cityName: 'Orsay' })

    expect(decision.action).toBe('apply')
    if (decision.action !== 'apply') return
    expect(decision.reason).toBe('citycode-match')
    expect(decision.city).toBe('Orsay')
  })

  it("ne réécrit rien quand l'adresse porte un numéro de boîte tronqué", async () => {
    // « CS 15250 » a été découpé : le code postal 15250 (Ayrens, Cantal) est
    // faux alors qu'il existe — la résidence est à Metz.
    const decision = await resolveAddressLocation({
      address: '2 rue du Général Delestraint CS',
      postalCode: '15250',
      cityName: 'Ayrens',
    })

    expect(decision).toEqual({ action: 'flag', reason: 'orphan-box-suffix' })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('conserve le point existant quand il est déjà dans une commune du code postal', async () => {
    mockApis(
      [
        { nom: 'Figeac', code: '46102', codeDepartement: '46', population: 9700, centre: { coordinates: [2.03, 44.6] } },
        { nom: 'Béduer', code: '46029', codeDepartement: '46', population: 700, centre: { coordinates: [1.98, 44.58] } },
      ],
      [feature({ lng: 5.0, lat: 45.0, city: 'Ailleurs', postcode: '01000', citycode: '01053', depcode: '01' })],
    )

    const decision = await resolveAddressLocation({
      address: 'rue inconnue de la BAN',
      postalCode: '46100',
      cityName: 'Béduer',
      currentInseeCode: '46102',
    })

    expect(decision).toEqual({ action: 'keep', reason: 'current-point-in-postcode' })
  })

  it('se rabat sur le département pour un code postal CEDEX', async () => {
    mockApis(
      [],
      [
        feature({ lng: 3.21, lat: 43.34, city: 'Béziers', postcode: '34500', citycode: '34032', depcode: '34' }),
        feature({ lng: 0.34, lat: 46.58, city: 'Poitiers', postcode: '86000', citycode: '86194', depcode: '86' }),
      ],
    )

    const decision = await resolveAddressLocation({ address: '11 rue Raoul Follereau', postalCode: '86022', cityName: 'Berrie' })

    expect(decision.action).toBe('apply')
    if (decision.action !== 'apply') return
    expect(decision.confidence).toBe('dept-only')
    expect(decision.city).toBe('Poitiers')
  })

  it('signale un CEDEX dont aucun candidat ne tombe dans le bon département', async () => {
    mockApis([], [feature({ lng: 0.1, lat: 49.49, city: 'Le Havre', postcode: '76600', citycode: '76351', depcode: '76' })])

    const decision = await resolveAddressLocation({ address: 'Rue Colette', postalCode: '59326', cityName: 'Killem' })

    expect(decision).toEqual({ action: 'flag', reason: 'cedex-no-dept-match' })
  })

  it('garde le point existant quand un CEDEX le situe déjà dans le bon département', async () => {
    mockApis([], [feature({ lng: 3.87, lat: 43.61, city: 'Montpellier', postcode: '34000', citycode: '34172', depcode: '34' })])

    const decision = await resolveAddressLocation({
      address: '259 VOIE DOMITIENNE',
      postalCode: '34096',
      cityName: 'Faugères',
      currentDepartment: '34',
    })

    expect(decision).toEqual({ action: 'keep', reason: 'cedex-current-in-dept' })
  })
})
