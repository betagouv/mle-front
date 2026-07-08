import { beforeEach, describe, expect, it, vi } from 'vitest'

const fetchMock = vi.fn()
vi.stubGlobal('fetch', fetchMock)

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body }
}

const UAI_DETAIL_SUP = {
  IDENTIFICATION: {
    NUMERO_UAI: '0341089Z',
    NATURES: [{ CODE: '520' }],
    SECTEURS: [{ CODE: 'PU' }],
    APPELLATIONS_OFFICIELLES: [{ VALEUR: 'Université de Montpellier' }],
    SIGLES: [{ VALEUR: 'UM' }],
  },
  LOCALISATION: {
    CODE_POSTAL: '34090',
    LOCALITE_ACHEMINEMENT: 'MONTPELLIER',
    TELEPHONE: '0411000000',
    MEL: 'contact@umontpellier.fr',
    ADRESSES: [{ VALEUR: '163 rue Auguste Broussonnet' }],
  },
  ADMINISTRATION: { CODE_INSEE_COMMUNE: '34172' },
  GEOLOCALISATION: { COORDONNEES_X: '3.86', COORDONNEES_Y: '43.61', SYSTEME_REFERENCE: 'WGS84' },
}

const UAI_DETAIL_ECOLE = {
  IDENTIFICATION: {
    NUMERO_UAI: '0340001A',
    NATURES: [{ CODE: '151' }], // école élémentaire → hors supérieur
    APPELLATIONS_OFFICIELLES: [{ VALEUR: 'Ecole primaire' }],
  },
  LOCALISATION: { CODE_POSTAL: '34090', LOCALITE_ACHEMINEMENT: 'MONTPELLIER' },
}

describe('ramsese service — getEtablissementsSuperieurByCodePostal', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    vi.resetModules()
  })

  it('enchaîne CP → communes → UAIs → détails et ne garde que le supérieur', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ code: '34172', nom: 'Montpellier' }])) // geo.api communes
      .mockResolvedValueOnce(jsonResponse([])) // geo.api arrondissements (aucun)
      .mockResolvedValueOnce(jsonResponse({ UAIS: ['0341089Z', '0340001A'] })) // filtres
      .mockResolvedValueOnce(jsonResponse(UAI_DETAIL_SUP)) // détail 1
      .mockResolvedValueOnce(jsonResponse(UAI_DETAIL_ECOLE)) // détail 2

    const { getEtablissementsSuperieurByCodePostal } = await import('./ramsese')
    const result = await getEtablissementsSuperieurByCodePostal('34090')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      numeroUai: '0341089Z',
      denomination: 'Université de Montpellier',
      sigle: 'UM',
      secteur: 'PU',
      adresse: '163 rue Auguste Broussonnet',
      codePostal: '34090',
      commune: 'MONTPELLIER',
      codeInseeCommune: '34172',
      coordonnees: { x: '3.86', y: '43.61', systemeReference: 'WGS84' },
    })
  })

  it('poste les communes INSEE (pas le code postal) au filtre RAMSESE', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ code: '34172', nom: 'Montpellier' }])) // communes
      .mockResolvedValueOnce(jsonResponse([])) // arrondissements
      .mockResolvedValueOnce(jsonResponse({ UAIS: [] })) // filtres

    const { getEtablissementsSuperieurByCodePostal } = await import('./ramsese')
    await getEtablissementsSuperieurByCodePostal('34090')

    const filtresCall = fetchMock.mock.calls[2]
    expect(filtresCall[0]).toContain('/listeUai/filtres')
    const body = JSON.parse(filtresCall[1].body)
    expect(body.communes).toEqual(['34172'])
  })

  it('inclut le code INSEE d’arrondissement pour Paris (75013 → 75056 + 75113)', async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse([{ code: '75056', nom: 'Paris' }])) // communes
      .mockResolvedValueOnce(jsonResponse([{ code: '75113', nom: 'Paris 13e Arrondissement' }])) // arrondissements
      .mockResolvedValueOnce(jsonResponse({ UAIS: [] })) // filtres

    const { getEtablissementsSuperieurByCodePostal } = await import('./ramsese')
    await getEtablissementsSuperieurByCodePostal('75013')

    const body = JSON.parse(fetchMock.mock.calls[2][1].body)
    expect(body.communes).toEqual(['75056', '75113'])
  })

  it('retourne [] quand le code postal est inconnu (aucun appel RAMSESE)', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse([])).mockResolvedValueOnce(jsonResponse([])) // communes + arrondissements

    const { getEtablissementsSuperieurByCodePostal } = await import('./ramsese')
    const result = await getEtablissementsSuperieurByCodePostal('00000')

    expect(result).toEqual([])
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('exclut les natures fermées (DATE_FIN renseignée)', async () => {
    const { _internal } = await import('./ramsese')
    const etab = _internal.toEtablissement({
      IDENTIFICATION: {
        NUMERO_UAI: '0341089Z',
        NATURES: [{ CODE: '520', DATE_FIN: '2020-01-01T00:00:00' }],
      },
    })
    expect(etab?.natureCodes).toEqual([])
  })
})
