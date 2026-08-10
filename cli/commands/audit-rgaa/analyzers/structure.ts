import type { CheerioAPI } from 'cheerio'
import type { TNode } from '../dom'
import { excerpt, isHidden, MODAL_CONTAINERS, stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

const HEADINGS = 'h1, h2, h3, h4, h5, h6, [role="heading"][aria-level]'

function headingLevel($: CheerioAPI, element: TNode): number {
  const tag = String($(element).prop('tagName')).toLowerCase()
  if (/^h[1-6]$/.test(tag)) return Number(tag[1])
  return Number($(element).attr('aria-level') ?? 0)
}

/**
 * Titres du document principal, hors modales : le DSFR rend ses modales avec un <h1>
 * (paramètres d'affichage, menu compte, filtres…) et duplique le contenu mobile/desktop.
 * Sans cette exclusion, 9.1 serait non conforme partout pour de mauvaises raisons.
 */
function mainOutline($: CheerioAPI): TNode[] {
  return $(HEADINGS)
    .toArray()
    .filter((element) => $(element).closest(MODAL_CONTAINERS).length === 0 && !isHidden($, element))
}

/** 9.1 — hiérarchie des titres. Condamne les sauts de niveau et l'absence de h1. */
export const structure91: TAnalyzer = {
  criterion: '9.1',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const headings = mainOutline($)
    if (headings.length === 0) return failing('Aucun titre (h1-h6) dans le contenu principal de la page')

    const levels = headings.map((element) => ({ level: headingLevel($, element), text: excerpt($(element).text(), 45) }))

    const h1s = levels.filter((heading) => heading.level === 1)
    const problems: string[] = []

    if (h1s.length === 0) problems.push('aucun <h1> dans le contenu principal')
    if (h1s.length > 1) problems.push(`${h1s.length} <h1> : ${h1s.map((h) => `« ${h.text || '(vide)'} »`).join(', ')}`)

    const empty = levels.filter((heading) => heading.text.length === 0)
    if (empty.length > 0) problems.push(`${empty.length} titre(s) sans contenu textuel`)

    const skips: string[] = []
    for (let index = 1; index < levels.length; index++) {
      const previous = levels[index - 1]
      const current = levels[index]
      if (current.level > previous.level + 1) {
        skips.push(`h${previous.level} « ${previous.text} » → h${current.level} « ${current.text} »`)
      }
    }
    if (skips.length > 0) problems.push(`${skips.length} saut(s) de niveau : ${listExamples(skips, 5)}`)

    if (problems.length > 0) {
      return failing(`${problems.join(' ; ')} (plan relevé : ${levels.map((h) => `h${h.level}`).join(' ')})`)
    }

    return conforming(
      `Plan de titres cohérent (${levels.map((h) => `h${h.level}`).join(' ')}) ; la pertinence des intitulés et les titres non balisés restent à vérifier`,
    )
  },
}

/** 9.2 — cohérence de la structure du document (zones de regroupement). */
export const structure92: TAnalyzer = {
  criterion: '9.2',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const mains = visible($, 'main, [role="main"]')
    const problems: string[] = []

    if (mains.length === 0) problems.push('aucune zone de contenu principal (<main> ou role="main")')
    if (mains.length > 1) problems.push(`${mains.length} zones de contenu principal (une seule attendue)`)

    const banners = visible($, 'body > header, [role="banner"]')
    if (banners.length > 1) problems.push(`${banners.length} zones d'en-tête de premier niveau`)

    const contentInfos = visible($, 'body > footer, [role="contentinfo"]')
    if (contentInfos.length > 1) problems.push(`${contentInfos.length} zones de pied de page de premier niveau`)

    if (problems.length > 0) return failing(problems.join(' ; '))

    return conforming(`Structure cohérente : 1 <main>, ${banners.length} en-tête, ${contentInfos.length} pied de page`)
  },
}

/** 9.3 — structuration des listes. Condamne les imbrications invalides. */
export const structure93: TAnalyzer = {
  criterion: '9.3',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const lists = visible($, 'ul, ol, dl')
    if (lists.length === 0) return notApplicable('Aucune liste (ul, ol, dl) dans le DOM de la page')

    const problems: string[] = []

    const orphanItems = visible($, 'li').filter((element) => {
      const parentTag = String($(element).parent().prop('tagName') ?? '').toLowerCase()
      const parentRole = $(element).parent().attr('role')
      return !['ul', 'ol', 'menu'].includes(parentTag) && parentRole !== 'list'
    })
    if (orphanItems.length > 0) {
      problems.push(
        `${orphanItems.length} <li> hors <ul>/<ol> : ${listExamples(
          orphanItems.map((el) => stableSelector($, el)),
          5,
        )}`,
      )
    }

    const strayChildren = visible($, 'ul > *, ol > *').filter((element) => {
      const tag = String($(element).prop('tagName')).toLowerCase()
      return !['li', 'script', 'template'].includes(tag)
    })
    if (strayChildren.length > 0) {
      problems.push(
        `${strayChildren.length} élément(s) non-<li> enfants directs d'une liste : ${listExamples(
          strayChildren.map((el) => stableSelector($, el)),
          5,
        )}`,
      )
    }

    const orphanTerms = visible($, 'dt, dd').filter((element) => String($(element).parent().prop('tagName') ?? '').toLowerCase() !== 'dl')
    if (orphanTerms.length > 0) problems.push(`${orphanTerms.length} <dt>/<dd> hors <dl>`)

    if (problems.length > 0) return failing(problems.join(' ; '))

    return conforming(`${lists.length} liste(s) correctement structurée(s) ; les listes visuelles non balisées restent à vérifier`)
  },
}
