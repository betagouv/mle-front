import { accessibleName, excerpt, stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

/** 12.6 — zones de regroupement identifiées par des balises ou rôles ARIA. */
export const navigation126: TAnalyzer = {
  criterion: '12.6',
  coversAllTests: true,
  analyze: ({ $ }) => {
    const zones = {
      'en-tête': visible($, 'header, [role="banner"]').length,
      'navigation principale': visible($, 'nav, [role="navigation"]').length,
      'contenu principal': visible($, 'main, [role="main"]').length,
      'pied de page': visible($, 'footer, [role="contentinfo"]').length,
    }

    const missing = Object.entries(zones)
      .filter(([, count]) => count === 0)
      .map(([label]) => label)

    if (missing.length > 0) {
      return failing(`Zone(s) de regroupement sans balise ni rôle ARIA : ${missing.join(', ')}`)
    }

    const detail = Object.entries(zones)
      .map(([label, count]) => `${label} ×${count}`)
      .join(', ')
    return conforming(`Toutes les zones de regroupement sont identifiées (${detail})`)
  },
}

/** 12.7 — lien d'évitement vers la zone de contenu principal. */
export const navigation127: TAnalyzer = {
  criterion: '12.7',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const mainIds = visible($, 'main[id], [role="main"][id]').map((element) => $(element).attr('id'))
    const anchors = $('body a[href^="#"]').toArray().slice(0, 15)

    const skipLinks = anchors.filter((element) => {
      const target = ($(element).attr('href') ?? '').slice(1)
      if (!target) return false
      const name = accessibleName($, element).toLowerCase()
      const looksLikeSkip = /(contenu|évitement|aller au|passer au|skip)/.test(name)
      return looksLikeSkip || mainIds.includes(target)
    })

    if (skipLinks.length === 0) {
      const mainHasId = mainIds.length > 0
      return failing(
        "Aucun lien d'évitement vers la zone de contenu principal en début de page" +
          (mainHasId ? '' : ' ; la balise <main> ne porte par ailleurs aucun id pouvant servir de cible'),
      )
    }

    const broken = skipLinks.filter((element) => {
      const target = ($(element).attr('href') ?? '').slice(1)
      return $(`#${target.replace(/([^\w-])/g, '\\$1')}`).length === 0
    })

    if (broken.length > 0) {
      return failing(`Lien d'évitement présent mais sa cible n'existe pas : ${listExamples(broken.map((el) => $(el).attr('href') ?? ''))}`)
    }

    const names = skipLinks.map((element) => `« ${excerpt(accessibleName($, element), 40)} »`)
    return conforming(`Lien(s) d'évitement présent(s) et pointant vers une cible existante : ${listExamples(names, 3)}`)
  },
}

/** 12.8 — ordre de tabulation. Condamne les tabindex positifs, qui le désorganisent. */
export const navigation128: TAnalyzer = {
  criterion: '12.8',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const positive = visible($, '[tabindex]')
      .filter((element) => Number($(element).attr('tabindex')) > 0)
      .map((element) => `${stableSelector($, element)} → tabindex="${$(element).attr('tabindex')}"`)

    if (positive.length > 0) {
      return failing(
        `${positive.length} élément(s) avec un tabindex positif, qui désorganise l'ordre de tabulation : ${listExamples(positive)}`,
      )
    }

    return conforming(
      "Aucun tabindex positif dans la page ; l'ordre de tabulation réel reste à parcourir au clavier pour juger sa cohérence",
    )
  },
}

/** 10.1 — les balises de présentation ne doivent pas figurer dans le code généré. */
export const presentation101: TAnalyzer = {
  criterion: '10.1',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const deprecatedTags = visible($, 'font, center, basefont, marquee, blink, big, tt, strike')
    const deprecatedAttributes = visible($, '[bgcolor], [align], [valign], [background], [border]:not(table), [cellpadding], [cellspacing]')

    const problems: string[] = []
    if (deprecatedTags.length > 0) {
      problems.push(
        `${deprecatedTags.length} balise(s) de présentation : ${listExamples(deprecatedTags.map((el) => String($(el).prop('tagName')).toLowerCase()))}`,
      )
    }
    if (deprecatedAttributes.length > 0) {
      problems.push(
        `${deprecatedAttributes.length} attribut(s) de présentation : ${listExamples(
          deprecatedAttributes.map((el) => stableSelector($, el)),
          5,
        )}`,
      )
    }

    if (problems.length > 0) return failing(problems.join(' ; '))

    return conforming(
      "Aucune balise ni attribut de présentation obsolète dans le code généré ; l'usage des espaces à des fins de présentation reste à vérifier",
    )
  },
}

/** 13.1 — contrôle des limites de temps. Condamne les rafraîchissements automatiques. */
export const consultation131: TAnalyzer = {
  criterion: '13.1',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const refreshes = $('meta[http-equiv="refresh"], meta[http-equiv="Refresh"]').toArray()
    if (refreshes.length === 0) {
      return conforming(
        'Aucune balise <meta http-equiv="refresh"> dans la page ; les limites de temps pilotées par script ou par la session restent à vérifier',
      )
    }

    const delayed = refreshes.filter((element) => Number(($(element).attr('content') ?? '').split(';')[0]) > 0)
    if (delayed.length > 0) {
      return failing(
        `${delayed.length} rafraîchissement(s) automatique(s) différé(s) via <meta http-equiv="refresh"> sans contrôle utilisateur`,
      )
    }

    return conforming(`${refreshes.length} redirection(s) <meta refresh> immédiate(s), conformes au test 13.1.2`)
  },
}

/** 13.3 / 13.4 — documents bureautiques en téléchargement. */
export const consultation133: TAnalyzer = {
  criterion: '13.3',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const documents = visible($, 'a[href]').filter((element) =>
      /\.(pdf|docx?|xlsx?|pptx?|odt|ods|odp)(\?|#|$)/i.test($(element).attr('href') ?? ''),
    )
    if (documents.length === 0) return notApplicable('Aucun lien vers un document bureautique en téléchargement dans la page')

    const names = documents.map((element) => `« ${excerpt(accessibleName($, element), 40)} »`)
    return conforming(
      `${documents.length} document(s) en téléchargement : ${listExamples(names, 5)} — accessibilité de chaque document à vérifier`,
    )
  },
}
