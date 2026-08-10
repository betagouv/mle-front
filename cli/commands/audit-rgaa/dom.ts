import type { CheerioAPI } from 'cheerio'
import * as cheerio from 'cheerio'
import type { AnyNode } from 'domhandler'

/**
 * Nœud DOM manipulé par les analyseurs. cheerio 1.x ne réexporte pas ses types de nœuds :
 * ils viennent de domhandler, déclaré explicitement en devDependency plutôt que capté
 * comme dépendance transitive.
 */
export type TNode = AnyNode

/**
 * Sous-arbres exclus de toute analyse : le HTML produit par Next contient un payload RSC
 * sérialisé dans des <script>, où figurent des chaînes qui ressemblent à des balises.
 * Les analyser produirait des faux positifs massifs.
 */
const NON_CONTENT = 'script, template, noscript, style'

/** Contenus masqués aux technologies d'assistance : les contrôler produirait des NC faux. */
const HIDDEN = '[aria-hidden="true"], [hidden], [style*="display:none"], [style*="display: none"]'

/**
 * React livre le contenu différé (Suspense) dans des conteneurs `<div hidden id="S:n">`
 * qu'un script greffe au bon endroit à l'hydratation. Ce `hidden` est technique : le
 * contenu qu'il enveloppe est bien affiché. Le confondre avec un masquage réel viderait
 * l'analyse de toute la partie streamée de la page.
 */
const STREAMING_CONTAINER = /^[SPB]:\d+$/

/** Conteneurs de modales DSFR : ils portent leur propre hiérarchie de titres. */
export const MODAL_CONTAINERS = '[role="dialog"], [aria-modal="true"], dialog, .fr-modal'

export type TDocument = {
  $: CheerioAPI
  /** Racine du contenu réel, hors payload technique. */
  html: string
}

export function loadDocument(html: string): TDocument {
  const $ = cheerio.load(html)
  $(NON_CONTENT).remove()
  return { $, html }
}

/** Vrai si l'élément (ou un de ses ancêtres) est masqué aux technologies d'assistance. */
export function isHidden($: CheerioAPI, element: TNode): boolean {
  return $(element)
    .parents()
    .addBack()
    .filter(HIDDEN)
    .toArray()
    .some((node) => !STREAMING_CONTAINER.test($(node).attr('id') ?? ''))
}

/** Éléments correspondant au sélecteur, hors sous-arbres masqués aux technologies d'assistance. */
export function visible($: CheerioAPI, selector: string): TNode[] {
  return $(selector)
    .toArray()
    .filter((element) => !isHidden($, element))
}

/** Tous les éléments correspondant au sélecteur, y compris masqués. */
export function all($: CheerioAPI, selector: string): TNode[] {
  return $(selector).toArray()
}

/**
 * Sélecteur reproductible pour désigner un élément dans la colonne Constat.
 * Volontairement court : il sert à retrouver l'élément, pas à le requêter.
 */
export function stableSelector($: CheerioAPI, element: TNode): string {
  const parts: string[] = []
  let current = $(element)

  while (current.length > 0 && current.prop('tagName')) {
    const tag = String(current.prop('tagName')).toLowerCase()
    if (tag === 'html' || tag === 'body') break

    const id = current.attr('id')
    if (id) {
      parts.unshift(`${tag}#${id}`)
      break
    }

    const className = (current.attr('class') ?? '')
      .split(/\s+/)
      .filter((name) => name.length > 0 && !name.startsWith('fr-'))
      .slice(0, 1)
      .join('')

    parts.unshift(className ? `${tag}.${className}` : tag)
    current = current.parent()
  }

  const selector = parts.slice(-4).join(' > ')
  return selector.length > 120 ? `${selector.slice(0, 117)}…` : selector
}

/** Nom accessible approché (aria-labelledby > aria-label > title > texte > alt). */
export function accessibleName($: CheerioAPI, element: TNode): string {
  const $element = $(element)

  const labelledBy = $element.attr('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) =>
        $(`#${CSS_escape(id)}`)
          .text()
          .trim(),
      )
      .filter(Boolean)
      .join(' ')
    if (text) return text
  }

  return (
    $element.attr('aria-label')?.trim() ||
    $element.text().replace(/\s+/g, ' ').trim() ||
    $element.attr('title')?.trim() ||
    $element.attr('alt')?.trim() ||
    // Un lien ou un bouton dont le seul contenu est une image tire son nom accessible
    // de l'alternative de cette image : l'ignorer produirait un faux « lien sans intitulé ».
    descendantImageName($, $element.toArray()[0])
  )
}

/** Alternative de la première image descendante, utilisée comme nom accessible de repli. */
function descendantImageName($: CheerioAPI, element?: TNode): string {
  if (!element) return ''
  const images = $(element).find('img[alt], [role="img"][aria-label], svg > title').toArray()
  for (const image of images) {
    const name = ($(image).attr('alt') ?? $(image).attr('aria-label') ?? $(image).text()).trim()
    if (name) return name
  }
  return ''
}

/** Échappement minimal pour injecter un id dans un sélecteur. */
function CSS_escape(value: string): string {
  return value.replace(/([ !"#$%&'()*+,./:;<=>?@[\\\]^`{|}~])/g, '\\$1')
}

const SCRUB_PATTERNS: [RegExp, string][] = [
  [/[\w.+-]+@[\w-]+\.[\w.]{2,}/g, '[email]'],
  [/\b(?:\+33|0)\s?[1-9](?:[\s.-]?\d{2}){4}\b/g, '[téléphone]'],
  [/\b\d{1,4}\s+(?:rue|avenue|av\.|boulevard|bd|impasse|allée|chemin|place|quai|route)\s+[^,;.]{3,40}/gi, '[adresse]'],
]

/**
 * Les pages authentifiées contiennent des données personnelles réelles de la base de dev.
 * Aucune ne doit atterrir dans une cellule du classeur.
 */
export function scrub(text: string): string {
  return SCRUB_PATTERNS.reduce((result, [pattern, replacement]) => result.replace(pattern, replacement), text)
}

/** Tronque un extrait destiné à une cellule, après nettoyage. */
export function excerpt(text: string, maxLength = 80): string {
  const cleaned = scrub(text.replace(/\s+/g, ' ').trim())
  return cleaned.length > maxLength ? `${cleaned.slice(0, maxLength - 1)}…` : cleaned
}

/**
 * Détecte le motif de duplication responsive du DSFR (fr-hidden / fr-unhidden-md) :
 * deux versions du même contenu coexistent dans le DOM sans être visibles ensemble.
 * Un doublon repéré ainsi est un artefact de gabarit, jamais une condamnation automatique.
 */
export function isResponsiveDuplicate($: CheerioAPI, element: TNode): boolean {
  return $(element)
    .parents()
    .addBack()
    .toArray()
    .some((node) => {
      const className = $(node).attr('class') ?? ''
      return /\bfr-(hidden|unhidden)(-\w+)?\b/.test(className)
    })
}
