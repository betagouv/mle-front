import { describe, expect, it } from 'vitest'
import { BROWSER_ANALYZERS, contrast32, focus107, reflow1011, tabOrder128, textSpacing1012, zoom104 } from '../browser/analyzers-browser'
import type { TBrowserSnapshot } from '../browser/collect-browser'
import { axeObservationsByCriterion, mergeAutoResults, unmappedAxeViolations } from '../browser/run-browser-analyzers'
import { blindSpotsFor } from '../pages'
import { buildReviewSheets } from '../review/extract'
import type { TAuditPage } from '../types'

function snapshot(overrides: Partial<TBrowserSnapshot> = {}): TBrowserSnapshot {
  const emptyViewport = { widthPx: 1280, documentScrollWidth: 1280, documentClientWidth: 1280, offenders: [] }
  return {
    scope: 'test',
    url: 'http://localhost:3000/',
    hydratedHtml: '<html lang="fr"><body></body></html>',
    contrast: [],
    focus: [],
    documentOrder: [],
    tabOrder: [],
    reflow320: { ...emptyViewport, widthPx: 320, documentScrollWidth: 320, documentClientWidth: 320 },
    zoom200: { ...emptyViewport, widthPx: 640, documentScrollWidth: 640, documentClientWidth: 640 },
    textSpacing: emptyViewport,
    axe: [],
    renderedWidgets: [],
    modals: [],
    movingContent: [],
    linksInText: [],
    colorDeclarations: [],
    interaction: { listenerTypes: [], accessKeys: [] },
    ...overrides,
  }
}

const sample = (over: Partial<TBrowserSnapshot['contrast'][number]> = {}) => ({
  selector: 'p',
  text: 'texte',
  color: 'rgb(0, 0, 0)',
  background: 'rgb(255, 255, 255)',
  ratio: 21,
  fontSizePx: 16,
  bold: false,
  threshold: 4.5,
  backgroundUncertain: false,
  ...over,
})

describe('analyseurs de rendu', () => {
  it('condamne un texte sous le seuil de contraste', () => {
    const verdict = contrast32.analyze(snapshot({ contrast: [sample({ ratio: 2.49 })] }))
    expect(verdict.status).toBe('NC')
    expect(verdict.detail).toContain('2,49:1')
  })

  it('ne condamne pas un contraste insuffisant dont le fond est indéterminable', () => {
    const verdict = contrast32.analyze(snapshot({ contrast: [sample({ ratio: 2.4, backgroundUncertain: true })] }))
    expect(verdict.status).not.toBe('NC')
    expect(verdict.detail).toContain('non déterminable')
  })

  it('applique le seuil abaissé de 3:1 au texte large', () => {
    const verdict = contrast32.analyze(snapshot({ contrast: [sample({ ratio: 3.5, fontSizePx: 24, threshold: 3 })] }))
    expect(verdict.status).toBe('C')
  })

  it('condamne un élément focusable sans indicateur de focus', () => {
    const verdict = focus107.analyze(
      snapshot({
        focus: [{ selector: 'input#a', label: 'Loyer', visible: false, detail: 'aucun changement visuel', indicatorContrast: null }],
      }),
    )
    expect(verdict.status).toBe('NC')
    expect(verdict.detail).toContain('input#a')
  })

  it('condamne un indicateur de focus sous le ratio de 3:1 exigé par le test 10.7.1', () => {
    const verdict = focus107.analyze(
      snapshot({
        focus: [{ selector: 'a#b', label: 'Aide', visible: true, detail: 'contour 2px solid', indicatorContrast: 1.8 }],
      }),
    )
    expect(verdict.status).toBe('NC')
    expect(verdict.detail).toContain('1.8')
  })

  it('conclut avec couverture intégrale quand tous les indicateurs sont mesurés au-dessus du seuil', () => {
    const verdict = focus107.analyze(
      snapshot({
        focus: [{ selector: 'a#b', label: 'Aide', visible: true, detail: 'contour 2px solid', indicatorContrast: 6.2 }],
      }),
    )
    expect(verdict).toMatchObject({ status: 'C', coversAllTests: true })
  })

  it("refuse la couverture intégrale dès qu'un indicateur n'est pas mesurable", () => {
    const verdict = focus107.analyze(
      snapshot({
        focus: [
          { selector: 'a#b', label: 'Aide', visible: true, detail: 'contour 2px solid', indicatorContrast: 6.2 },
          { selector: 'a#c', label: 'Menu', visible: true, detail: 'style modifié au focus', indicatorContrast: null },
        ],
      }),
    )
    expect(verdict).toMatchObject({ status: 'C', coversAllTests: false })
  })

  it('condamne un défilement horizontal à 320 px', () => {
    const verdict = reflow1011.analyze(
      snapshot({
        reflow320: {
          widthPx: 320,
          documentScrollWidth: 341,
          documentClientWidth: 320,
          offenders: [{ selector: 'strong', overflowPx: 21 }],
        },
      }),
    )
    expect(verdict.status).toBe('NC')
    expect(verdict.detail).toContain('341px')
  })

  it('condamne un débordement au zoom 200 %', () => {
    const verdict = zoom104.analyze(
      snapshot({ zoom200: { widthPx: 640, documentScrollWidth: 734, documentClientWidth: 640, offenders: [] } }),
    )
    expect(verdict.status).toBe('NC')
  })

  it('condamne une perte de contenu après application des espacements', () => {
    const verdict = textSpacing1012.analyze(
      snapshot({ textSpacing: { widthPx: 1280, documentScrollWidth: 1310, documentClientWidth: 1280, offenders: [] } }),
    )
    expect(verdict.status).toBe('NC')
  })

  it("détecte une inversion de l'ordre de tabulation sur le rang réel des éléments", () => {
    const verdict = tabOrder128.analyze(
      snapshot({
        tabOrder: [
          { order: 0, selector: 'a', label: 'un', documentOrder: 5 },
          { order: 1, selector: 'a', label: 'deux', documentOrder: 2 },
        ],
      }),
    )
    expect(verdict.status).toBe('NC')
    expect(verdict.detail).toContain('deux')
  })

  it("ne signale pas d'inversion quand deux arrêts partagent le même sélecteur", () => {
    const verdict = tabOrder128.analyze(
      snapshot({
        tabOrder: [
          { order: 0, selector: 'div > ul > li > a', label: 'un', documentOrder: 1 },
          { order: 1, selector: 'div > ul > li > a', label: 'deux', documentOrder: 2 },
        ],
      }),
    )
    expect(verdict.status).toBe('C')
  })
})

describe('inapplicabilité prouvée par le registre des interactions', () => {
  const analyzerFor = (criterion: string) => {
    const analyzer = BROWSER_ANALYZERS.find((item) => item.criterion === criterion)
    if (!analyzer) throw new Error(`Analyseur ${criterion} absent du registre`)
    return analyzer
  }

  it('déclare 13.10 et 13.12 non applicables sans écouteur tactile ni de mouvement', () => {
    for (const criterion of ['13.10', '13.12']) {
      const verdict = analyzerFor(criterion).analyze(snapshot({ interaction: { listenerTypes: ['click'], accessKeys: [] } }))
      expect(verdict.status).toBe('NA')
    }
  })

  it("rend 13.10 applicable dès qu'un écouteur tactile est enregistré", () => {
    const verdict = analyzerFor('13.10').analyze(snapshot({ interaction: { listenerTypes: ['touchstart'], accessKeys: [] } }))
    expect(verdict.status).toBe('C')
    expect(verdict.detail).toContain('touchstart')
  })

  it('rend 12.10 applicable sur un attribut accesskey, même sans écouteur clavier', () => {
    const verdict = analyzerFor('12.10').analyze(snapshot({ interaction: { listenerTypes: [], accessKeys: ['s'] } }))
    expect(verdict.status).toBe('C')
    expect(verdict.detail).toContain('accesskey="s"')
  })

  it("n'invente rien lorsque le relevé d'interactions manque au snapshot", () => {
    const stale = { ...snapshot(), interaction: undefined } as unknown as Parameters<typeof focus107.analyze>[0]
    expect(analyzerFor('13.10').analyze(stale).status).toBe('NA')
  })
})

describe('fusion des deux passes automatiques', () => {
  it('retient le statut le plus sévère et conserve les deux constats', () => {
    const merged = mergeAutoResults(
      [{ criterion: '3.2', status: 'NT', observation: 'constat DOM', fullyCovered: false }],
      [{ criterion: '3.2', status: 'NC', observation: 'constat rendu', fullyCovered: false, priority: 'P1', remediation: 'corriger' }],
      new Map(),
    )
    expect(merged[0].status).toBe('NC')
    expect(merged[0].observation).toContain('constat DOM')
    expect(merged[0].observation).toContain('constat rendu')
    expect(merged[0].remediation).toBe('corriger')
  })

  it("n'affaiblit pas une non-conformité du DOM avec un verdict de rendu plus clément", () => {
    const merged = mergeAutoResults(
      [{ criterion: '9.1', status: 'NC', observation: 'saut de niveau', fullyCovered: false, priority: 'P2', remediation: 'corriger' }],
      [{ criterion: '9.1', status: 'C', observation: 'plan cohérent', fullyCovered: false }],
      new Map(),
    )
    expect(merged[0].status).toBe('NC')
  })

  it('verse les violations axe au constat du critère correspondant sans changer son statut', () => {
    const axe = axeObservationsByCriterion([
      snapshot({
        axe: [
          { id: 'color-contrast', impact: 'serious', help: 'Contraste insuffisant', helpUrl: '', nodes: [{ target: 'p', summary: '' }] },
        ],
      }),
    ])
    const merged = mergeAutoResults([{ criterion: '3.2', status: 'C', observation: 'ok', fullyCovered: false }], [], axe)
    expect(merged[0].status).toBe('C')
    expect(merged[0].observation).toContain('color-contrast')
  })

  it("conserve la violation axe d'un critère dépourvu d'analyseur, en « à vérifier »", () => {
    const axe = axeObservationsByCriterion([
      snapshot({
        axe: [
          {
            id: 'aria-valid-attr-value',
            impact: 'critical',
            help: 'Attribut ARIA invalide',
            helpUrl: '',
            nodes: [{ target: 'div', summary: '' }],
          },
        ],
      }),
    ])

    const merged = mergeAutoResults([], [], axe)

    expect(merged).toHaveLength(1)
    expect(merged[0]).toMatchObject({ criterion: '7.1', status: 'NT', fullyCovered: false })
    expect(merged[0].observation).toContain('aria-valid-attr-value')
  })

  it('remonte séparément les règles axe sans correspondance RGAA', () => {
    const unmapped = unmappedAxeViolations([
      snapshot({ axe: [{ id: 'regle-inconnue', impact: 'minor', help: '', helpUrl: '', nodes: [{ target: 'div', summary: '' }] }] }),
    ])
    expect(unmapped).toEqual(['regle-inconnue (1 occurrence(s))'])
  })
})

describe('levée des angles morts', () => {
  const page = {
    id: 'recherche',
    sheetName: 'Recherche',
    label: 'Recherche',
    auth: false,
    isTemplate: false,
    clientOnlyWidgets: ['leaflet-map', 'dsfr-modals'],
    urls: [{ scope: 'résultats', path: '/', assertContains: [] }],
  } as TAuditPage

  it('verrouille les critères des widgets tant que le rendu ne les a pas observés', () => {
    expect(blindSpotsFor(page).has('7.3')).toBe(true)
  })

  it('lève le verrou quand le widget est observé dans le DOM hydraté', () => {
    expect(blindSpotsFor(page, ['leaflet-map']).has('7.3')).toBe(false)
  })

  it('maintient le verrou des modales même observées : elles restent fermées', () => {
    expect(blindSpotsFor(page, ['leaflet-map', 'dsfr-modals']).has('12.9')).toBe(true)
  })
})

describe('cahier de relevés', () => {
  const html = `<html lang="fr"><head><title>Ma page</title></head><body>
    <h1>Titre principal</h1>
    <img src="a.png" alt="Un logement">
    <img src="b.png" alt="">
    <p>Consultez <a href="/aides" title="Aides">les aides</a> disponibles.</p>
    <form><label for="ville">Ville</label><input id="ville" name="city" autocomplete="address-level2" required></form>
    <table><caption>Loyers</caption><tr><th scope="col">Ville</th></tr></table>
  </body></html>`

  const families = buildReviewSheets([{ pageLabel: 'Accueil', scope: 'fr', html }])
  const family = (key: string) => families.find((item) => item.key === key)

  it('relève chaque image avec son alternative et distingue les décoratives', () => {
    const rows = family('images')?.rows ?? []
    expect(rows).toHaveLength(2)
    expect(rows[0].values).toContain('Un logement')
    expect(rows[1].values).toContain('(décorative)')
  })

  it('relève chaque lien avec sa destination', () => {
    const rows = family('liens')?.rows ?? []
    expect(rows[0].values[0]).toBe('les aides')
    expect(rows[0].values[1]).toBe('/aides')
  })

  it('relève chaque champ avec son étiquette et sa finalité', () => {
    const rows = family('champs')?.rows ?? []
    expect(rows[0].values).toContain('Ville')
    expect(rows[0].values).toContain('obligatoire')
    expect(rows[0].values).toContain('address-level2')
  })

  it('relève le titre de page, le h1 et la langue déclarée', () => {
    const rows = family('pages')?.rows ?? []
    expect(rows[0].values).toEqual(['Ma page', 'Titre principal', 'fr'])
  })

  it("n'émet aucun statut : le cahier ne fait que préparer le jugement", () => {
    for (const item of families) {
      expect(item).not.toHaveProperty('status')
      expect(item.question).toMatch(/\?/)
      expect(item.truncated).toBe(0)
    }
  })
})
