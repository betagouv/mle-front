import { accessibleName, excerpt, stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

/** Intitulés notoirement non explicites hors contexte (RGAA 6.1). */
const AMBIGUOUS_LABELS = [
  'en savoir plus',
  'lire la suite',
  'cliquez ici',
  'cliquer ici',
  'ici',
  'voir plus',
  'plus',
  'détails',
  'accéder',
  'découvrir',
  'télécharger',
]

/** Mentions acceptables signalant l'ouverture dans une nouvelle fenêtre (RGAA 13.2). */
const NEW_WINDOW_HINTS = ['nouvelle fenêtre', 'nouvel onglet', 'ouvre dans', "s'ouvre dans", 'new window', 'new tab']

/** 6.1 — chaque lien est-il explicite ? Condamne les liens sans nom accessible du tout. */
export const link61: TAnalyzer = {
  criterion: '6.1',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const links = visible($, 'a[href]')
    if (links.length === 0) return notApplicable('Aucun lien (a[href]) dans le DOM de la page')

    const nameless: string[] = []
    const ambiguous = new Map<string, number>()

    for (const element of links) {
      const name = accessibleName($, element).toLowerCase().trim()
      if (!name) {
        nameless.push(`${stableSelector($, element)} → ${$(element).attr('href')?.slice(0, 50) ?? ''}`)
        continue
      }
      if (AMBIGUOUS_LABELS.includes(name)) ambiguous.set(name, (ambiguous.get(name) ?? 0) + 1)
    }

    if (nameless.length > 0) {
      return failing(`${nameless.length} lien(s) sans intitulé ni nom accessible sur ${links.length} : ${listExamples(nameless)}`)
    }

    if (ambiguous.size > 0) {
      const detail = [...ambiguous.entries()].map(([label, count]) => `« ${label} » ×${count}`).join(' ; ')
      return failing(
        `Intitulés de lien non explicites hors contexte : ${detail}. ` +
          "Conforme uniquement si le contexte est lié programmatiquement (aria-label, aria-labelledby ou title complétant l'intitulé)",
      )
    }

    return conforming(`${links.length} lien(s) contrôlé(s), tous pourvus d'un intitulé ; la pertinence de chaque intitulé reste à juger`)
  },
}

/**
 * 6.2 — chaque lien a-t-il un intitulé ?
 *
 * Le critère ne compte qu'un test, purement structurel : la méthodologie 6.2.1 demande de
 * retrouver « les liens quels qu'ils soient » — élément `<a>` ou porteur de `role="link"` — et
 * de vérifier que chacun contient un intitulé, texte ou alternative. C'est exactement ce que
 * fait `accessibleName`, d'où la couverture intégrale. La *pertinence* de l'intitulé relève du
 * critère 6.1, qui reste un jugement humain.
 */
export const link62: TAnalyzer = {
  criterion: '6.2',
  coversAllTests: true,
  analyze: ({ $ }) => {
    const links = visible($, 'a[href], [role="link"]')
    if (links.length === 0) return notApplicable('Aucun lien (a[href], [role=link]) dans le DOM de la page')

    const nameless = links
      .filter((element) => accessibleName($, element).trim().length === 0)
      .map((element) => `${stableSelector($, element)} → ${$(element).attr('href')?.slice(0, 50) ?? ''}`)

    if (nameless.length > 0) {
      return failing(`${nameless.length} lien(s) sans intitulé sur ${links.length} : ${listExamples(nameless)}`)
    }

    return conforming(`${links.length} lien(s), tous pourvus d'un intitulé`)
  },
}

/** 13.2 — l'ouverture d'une nouvelle fenêtre doit être signalée à l'utilisateur. */
export const consultation132: TAnalyzer = {
  criterion: '13.2',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const blankLinks = visible($, 'a[target="_blank"], a[target="blank"]')
    if (blankLinks.length === 0) return notApplicable('Aucun lien ouvrant une nouvelle fenêtre (target="_blank") dans le DOM de la page')

    const unannounced: string[] = []

    for (const element of blankLinks) {
      const context = `${accessibleName($, element)} ${$(element).attr('title') ?? ''}`.toLowerCase()
      if (!NEW_WINDOW_HINTS.some((hint) => context.includes(hint))) {
        unannounced.push(`« ${excerpt(accessibleName($, element), 45)} »`)
      }
    }

    if (unannounced.length > 0) {
      return failing(
        `${unannounced.length} lien(s) sur ${blankLinks.length} ouvrent une nouvelle fenêtre sans le signaler : ${listExamples(unannounced)}`,
      )
    }

    return conforming(`${blankLinks.length} lien(s) target="_blank", tous signalent l'ouverture d'une nouvelle fenêtre`)
  },
}
