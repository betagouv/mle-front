import { describe, expect, it } from 'vitest'
import { ANALYZERS, runAnalyzers } from '../analyzers'
import { form116 } from '../analyzers/forms'
import { frame21 } from '../analyzers/frames'
import { image11 } from '../analyzers/images'
import { link62 } from '../analyzers/links'
import { mandatory85 } from '../analyzers/mandatory'
import { AUTO_REMEDIATIONS } from '../analyzers/remediations'
import { structure91 } from '../analyzers/structure'
import type { TCollectedPage } from '../collect'
import { loadDocument, scrub } from '../dom'

const page = (html: string, scope = 'test'): TCollectedPage => ({
  scope,
  url: 'http://localhost/test',
  acceptLanguage: 'fr-FR',
  httpStatus: 200,
  bytes: html.length,
  html,
})

const analyze = (analyzer: (typeof ANALYZERS)[number], html: string) => analyzer.analyze(loadDocument(html), 'test')

describe('analyseurs — pièges du HTML Next.js', () => {
  it('ignore le contenu des <script> : le payload RSC contient des chaînes ressemblant à des balises', () => {
    const html = '<html lang="fr"><body><script>{"html":"<img src=x>"}</script><p>texte</p></body></html>'
    expect(analyze(image11, html).status).toBe('NA')
  })

  it('n\'exclut pas le contenu livré dans un conteneur de streaming React (<div hidden id="S:0">)', () => {
    const html = '<html lang="fr"><body><div hidden id="S:0"><img src="a.png"></div></body></html>'
    expect(analyze(image11, html).status).toBe('NC')
  })

  it("exclut en revanche le contenu réellement masqué aux technologies d'assistance", () => {
    const html = '<html lang="fr"><body><div aria-hidden="true"><img src="a.png"></div></body></html>'
    expect(analyze(image11, html).status).toBe('NA')
  })

  it('construit le plan de titres hors des modales DSFR, qui portent leur propre <h1>', () => {
    const html = `<html lang="fr"><body>
      <dialog class="fr-modal"><h1 class="fr-modal__title">Paramètres d'affichage</h1></dialog>
      <dialog class="fr-modal"><h1 class="fr-modal__title"></h1></dialog>
      <main><h1>Titre de la page</h1><h2>Section</h2></main>
    </body></html>`
    const verdict = analyze(structure91, html)
    expect(verdict.status).toBe('C')
    expect(verdict.detail).toContain('h1 h2')
  })

  it('condamne un saut de niveau de titre', () => {
    const html = '<html lang="fr"><body><main><h1>A</h1><h4>B</h4></main></body></html>'
    const verdict = analyze(structure91, html)
    expect(verdict.status).toBe('NC')
    expect(verdict.detail).toContain('saut(s) de niveau')
  })

  it("conclut « non applicable » en l'absence de cadre, et condamne un cadre sans titre", () => {
    expect(analyze(frame21, '<html><body><p>rien</p></body></html>').status).toBe('NA')
    expect(analyze(frame21, '<html><body><iframe src="a"></iframe></body></html>').status).toBe('NC')
    expect(analyze(frame21, '<html><body><iframe src="a" title="Carte"></iframe></body></html>').status).toBe('C')
  })

  it("trouve le <title> même lorsque Next l'émet hors du <head>", () => {
    expect(analyze(mandatory85, '<html><body><title>Ma page</title></body></html>').status).toBe('C')
    expect(analyze(mandatory85, '<html><body><p>rien</p></body></html>').status).toBe('NC')
  })
})

describe('agrégation multi-écrans', () => {
  const blindSpots = new Map<string, string[]>()

  it("condamne dès qu'un seul écran est fautif", () => {
    const results = runAnalyzers(
      [
        page('<html><body><iframe title="ok"></iframe></body></html>', 'étape 1'),
        page('<html><body><iframe></iframe></body></html>', 'étape 2'),
      ],
      blindSpots,
    )
    const frame = results.find((result) => result.criterion === '2.1')
    expect(frame?.status).toBe('NC')
    expect(frame?.observation).toContain('[étape 2]')
  })

  it('empêche de conclure sur un critère verrouillé par un angle mort, sans effacer une non-conformité observée', () => {
    const locked = new Map([['2.1', ['carte Leaflet']]])
    const clean = runAnalyzers([page('<html><body><iframe title="ok"></iframe></body></html>')], locked)
    expect(clean.find((result) => result.criterion === '2.1')?.status).toBe('NT')

    const faulty = runAnalyzers([page('<html><body><iframe></iframe></body></html>')], locked)
    expect(faulty.find((result) => result.criterion === '2.1')?.status).toBe('NC')
  })

  it('attache une priorité et une résolution à chaque non-conformité automatique', () => {
    const results = runAnalyzers([page('<html><body><iframe></iframe></body></html>')], blindSpots)
    for (const result of results.filter((item) => item.status === 'NC')) {
      expect(result.priority).toBeDefined()
      expect(result.remediation).toBeTruthy()
    }
  })
})

describe('registre', () => {
  it('déclare une résolution pour chaque analyseur pouvant condamner', () => {
    const missing = ANALYZERS.filter((analyzer) => !AUTO_REMEDIATIONS[analyzer.criterion]).map((analyzer) => analyzer.criterion)
    // Les analyseurs de la famille « non applicable » ne condamnent jamais.
    const condemning = missing.filter((criterion) =>
      ANALYZERS.some((analyzer) => analyzer.criterion === criterion && analyzer.coversAllTests),
    )
    expect(condemning).toEqual([])
  })

  it("n'autorise « conforme » que pour les analyseurs couvrant l'intégralité des tests", () => {
    const results = runAnalyzers(
      [page('<html lang="fr"><head><title>T</title></head><body><main><h1>A</h1></main></body></html>')],
      new Map(),
    )
    for (const result of results.filter((item) => item.status === 'C')) {
      expect(result.fullyCovered).toBe(true)
    }
  })
})

describe('couverture intégrale — critères promus', () => {
  it('6.2 : compte les éléments porteurs de role="link" comme des liens', () => {
    const html = '<html lang="fr"><body><span role="link" tabindex="0"></span></body></html>'
    expect(analyze(link62, html)).toMatchObject({ status: 'NC' })
  })

  it('6.2 : conclut « conforme » quand tous les liens ont un intitulé', () => {
    const html = '<html lang="fr"><body><a href="/a">Accueil</a><span role="link" tabindex="0">Aide</span></body></html>'
    expect(analyze(link62, html).status).toBe('C')
    expect(link62.coversAllTests).toBe(true)
  })
})

describe('11.6 — les trois formes de regroupement admises', () => {
  const wrap = (body: string) => `<html lang="fr"><body><form>${body}</form></body></html>`

  it('accepte un role="group" pourvu d\'un aria-label', () => {
    const html = wrap('<div role="group" aria-label="Situation"><input type="radio" name="s"></div>')
    expect(analyze(form116, html).status).toBe('C')
  })

  it('accepte un conteneur sans intitulé dont chaque champ porte son rattachement', () => {
    const html = wrap(
      '<div role="radiogroup"><input type="radio" name="s" aria-label="Oui"><input type="radio" name="s" title="Non"></div>',
    )
    expect(analyze(form116, html).status).toBe('C')
  })

  it('condamne un regroupement sans intitulé ni rattachement par champ', () => {
    const html = wrap('<fieldset><input type="radio" name="s"></fieldset>')
    expect(analyze(form116, html).status).toBe('NC')
  })

  it("reste non applicable en l'absence de tout conteneur de regroupement", () => {
    expect(analyze(form116, wrap('<input type="text" name="s">')).status).toBe('NA')
  })
})

describe('anonymisation', () => {
  it('retire les données personnelles avant écriture dans une cellule', () => {
    expect(scrub('contact jean.dupont@example.com et 06 12 34 56 78')).toBe('contact [email] et [téléphone]')
    expect(scrub('12 rue des Lilas, Paris')).toContain('[adresse]')
  })
})
