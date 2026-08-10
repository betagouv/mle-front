import type { CheerioAPI } from 'cheerio'
import { accessibleName, excerpt, isHidden, loadDocument, stableSelector, visible } from '../dom'

/**
 * Cahier de relevés.
 *
 * Ces feuilles **ne statuent rien**. Elles répondent à un constat simple : la plupart des
 * contrôles restants ne demandent pas d'explorer les pages, mais de juger une liste — les
 * alternatives sont-elles pertinentes, les intitulés explicites, les étiquettes claires. La
 * machine dresse la liste, l'auditeur tranche. C'est de la préparation, pas du verdict : un
 * relevé ne peut donc pas se tromper de statut.
 */
export type TReviewRow = {
  page: string
  scope: string
  values: string[]
}

export type TReviewFamily = {
  key: string
  /** Nombre de lignes écartées par le plafond, s'il a été atteint. Jamais silencieux. */
  truncated: number
  /** Nom de l'onglet Excel : 31 caractères maximum. */
  sheetName: string
  title: string
  /** Critères que ce relevé sert à juger. */
  criteria: string[]
  /** Question posée à l'auditeur pour chaque ligne. */
  question: string
  columns: string[]
  rows: TReviewRow[]
}

export type TReviewSource = {
  pageLabel: string
  scope: string
  html: string
}

const MAX_ROWS_PER_FAMILY = 400

function textOf($: CheerioAPI, element: Parameters<typeof stableSelector>[1]): string {
  return excerpt($(element).text(), 70)
}

/** Contexte immédiat d'un élément : sert à juger la pertinence hors contexte. */
function contextOf($: CheerioAPI, element: Parameters<typeof stableSelector>[1]): string {
  const parent = $(element).parent()
  return excerpt(parent.text(), 70)
}

function extractImages(source: TReviewSource): TReviewRow[] {
  const { $ } = loadDocument(source.html)
  const rows: TReviewRow[] = []

  for (const element of visible($, 'img, svg, [role="img"], input[type="image"], area')) {
    const $element = $(element)
    const tag = String($element.prop('tagName') ?? '').toLowerCase()
    const alt = $element.attr('alt')
    const ariaLabel = $element.attr('aria-label')
    const svgTitle = tag === 'svg' ? $element.children('title').text().trim() : ''
    const alternative = alt ?? ariaLabel ?? svgTitle
    const decorative = alt === '' || $element.attr('aria-hidden') === 'true'

    rows.push({
      page: source.pageLabel,
      scope: source.scope,
      values: [
        tag,
        stableSelector($, element),
        decorative ? '(décorative)' : (alternative ?? '(aucune)'),
        decorative ? 'décorative' : 'porteuse d’information ?',
        contextOf($, element),
      ],
    })
  }

  return rows
}

function extractLinks(source: TReviewSource): TReviewRow[] {
  const { $ } = loadDocument(source.html)
  const rows: TReviewRow[] = []

  for (const element of visible($, 'a[href]')) {
    const $element = $(element)
    const href = $element.attr('href') ?? ''
    rows.push({
      page: source.pageLabel,
      scope: source.scope,
      values: [
        excerpt(accessibleName($, element), 60),
        href.length > 70 ? `${href.slice(0, 69)}…` : href,
        $element.attr('target') === '_blank' ? 'nouvelle fenêtre' : '',
        excerpt($element.attr('title') ?? '', 40),
        contextOf($, element),
      ],
    })
  }

  return rows
}

function extractFields(source: TReviewSource): TReviewRow[] {
  const { $ } = loadDocument(source.html)
  const rows: TReviewRow[] = []
  const selector = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea'

  for (const element of visible($, selector)) {
    const $element = $(element)
    const id = $element.attr('id')
    const explicitLabel = id
      ? $(`label[for="${id.replace(/"/g, '\\"')}"]`)
          .text()
          .trim()
      : ''
    // Trois formes d'étiquetage valides échappaient à la lecture par `for` : l'étiquette
    // enveloppante, et les références aria-labelledby que le DSFR pose sur ses curseurs.
    // Sans elles, le relevé affichait « sans étiquette » des champs parfaitement conformes,
    // et envoyait l'auditeur vérifier des non-conformités inexistantes.
    const wrappingLabel = $element.closest('label').text().trim()
    const labelledBy = ($element.attr('aria-labelledby') ?? '')
      .split(/\s+/)
      .filter(Boolean)
      .map((reference) =>
        $(`#${reference.replace(/"/g, '\\"')}`)
          .text()
          .trim(),
      )
      .filter(Boolean)
      .join(' ')
    const label = explicitLabel || wrappingLabel || labelledBy
    const legend = $element.closest('fieldset').children('legend').text().trim()

    rows.push({
      page: source.pageLabel,
      scope: source.scope,
      values: [
        $element.attr('type') ?? String($element.prop('tagName') ?? '').toLowerCase(),
        $element.attr('name') ?? '',
        excerpt(label || $element.attr('aria-label') || '', 50),
        excerpt(legend, 40),
        excerpt($element.attr('placeholder') ?? '', 35),
        $element.attr('required') !== undefined || $element.attr('aria-required') === 'true' ? 'obligatoire' : '',
        $element.attr('autocomplete') ?? '',
      ],
    })
  }

  return rows
}

function extractHeadings(source: TReviewSource): TReviewRow[] {
  const { $ } = loadDocument(source.html)
  const rows: TReviewRow[] = []

  for (const element of $('h1, h2, h3, h4, h5, h6').toArray()) {
    if (isHidden($, element)) continue
    const level = String($(element).prop('tagName') ?? '').toLowerCase()
    rows.push({
      page: source.pageLabel,
      scope: source.scope,
      values: [level, textOf($, element), stableSelector($, element)],
    })
  }

  return rows
}

function extractTables(source: TReviewSource): TReviewRow[] {
  const { $ } = loadDocument(source.html)
  const rows: TReviewRow[] = []

  for (const element of visible($, 'table')) {
    const $element = $(element)
    rows.push({
      page: source.pageLabel,
      scope: source.scope,
      values: [
        excerpt($element.children('caption').text(), 50) || '(aucune légende)',
        String($element.find('th').length),
        String($element.find('th[scope]').length),
        String($element.find('tr').length),
        $element.attr('role') === 'presentation' || $element.attr('role') === 'none' ? 'mise en forme' : 'données',
        stableSelector($, element),
      ],
    })
  }

  return rows
}

function extractPageIdentity(source: TReviewSource): TReviewRow[] {
  const { $ } = loadDocument(source.html)
  const headings = $('h1')
    .toArray()
    .filter((element) => !isHidden($, element))
    .map((element) => textOf($, element))

  return [
    {
      page: source.pageLabel,
      scope: source.scope,
      values: [excerpt($('title').first().text(), 80), headings.join(' / ') || '(aucun h1)', $('html').attr('lang') ?? '(absent)'],
    },
  ]
}

/** `rows` et `truncated` sont calculés à l'extraction : la définition ne les porte pas. */
type TFamilyDefinition = Omit<TReviewFamily, 'rows' | 'truncated'> & { extract: (source: TReviewSource) => TReviewRow[] }

const FAMILIES: TFamilyDefinition[] = [
  {
    key: 'images',
    sheetName: 'Relevé - images',
    title: 'Images et alternatives',
    criteria: ['1.1', '1.2', '1.3', '1.4', '1.5', '1.6', '1.7', '1.8', '1.9'],
    question: 'Alternative pertinente ? (O / N / NA)',
    columns: ['Balise', 'Sélecteur', 'Alternative', 'Nature', 'Contexte'],
    extract: extractImages,
  },
  {
    key: 'liens',
    sheetName: 'Relevé - liens',
    title: 'Liens et destinations',
    criteria: ['6.1', '6.2', '13.2', '13.3', '13.4'],
    question: 'Intitulé explicite hors contexte ? (O / N)',
    columns: ['Intitulé', 'Destination', 'Ouverture', 'Attribut title', 'Contexte'],
    extract: extractLinks,
  },
  {
    key: 'champs',
    sheetName: 'Relevé - champs',
    title: 'Champs de formulaire et étiquettes',
    criteria: ['11.1', '11.2', '11.3', '11.4', '11.5', '11.6', '11.7', '11.10', '11.13'],
    question: 'Étiquette pertinente et suffisante ? (O / N)',
    columns: ['Type', 'Nom', 'Étiquette', 'Légende du groupe', 'Placeholder', 'Obligatoire', 'Autocomplete'],
    extract: extractFields,
  },
  {
    key: 'titres',
    sheetName: 'Relevé - titres',
    title: 'Plan de titres',
    criteria: ['9.1', '9.2'],
    question: 'Intitulé pertinent et niveau juste ? (O / N)',
    columns: ['Niveau', 'Intitulé', 'Sélecteur'],
    extract: extractHeadings,
  },
  {
    key: 'tableaux',
    sheetName: 'Relevé - tableaux',
    title: 'Tableaux',
    criteria: ['5.1', '5.2', '5.3', '5.4', '5.5', '5.6', '5.7', '5.8'],
    question: 'Structure conforme à la nature du tableau ? (O / N)',
    columns: ['Légende', 'Nb <th>', 'Nb <th scope>', 'Nb lignes', 'Nature déclarée', 'Sélecteur'],
    extract: extractTables,
  },
  {
    key: 'pages',
    sheetName: 'Relevé - pages',
    title: 'Titres de page et langue',
    criteria: ['8.5', '8.6', '8.3', '8.4'],
    question: 'Titre de page pertinent et distinctif ? (O / N)',
    columns: ['Balise <title>', 'Titre principal <h1>', 'Langue déclarée'],
    extract: extractPageIdentity,
  },
]

/**
 * Construit le cahier de relevés à partir de tous les écrans collectés, modales ouvertes
 * comprises : c'est le seul endroit du classeur où leur contenu est restitué.
 */
export function buildReviewSheets(sources: TReviewSource[]): TReviewFamily[] {
  return FAMILIES.map((family) => {
    const rows: TReviewRow[] = []
    for (const source of sources) {
      if (rows.length >= MAX_ROWS_PER_FAMILY) break
      try {
        rows.push(...family.extract(source))
      } catch {
        // Un écran illisible ne doit pas faire échouer le cahier entier.
      }
    }
    const { extract: _extract, ...definition } = family
    return { ...definition, truncated: Math.max(0, rows.length - MAX_ROWS_PER_FAMILY), rows: rows.slice(0, MAX_ROWS_PER_FAMILY) }
  })
}
