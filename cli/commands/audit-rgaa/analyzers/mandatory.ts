import { excerpt, stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

/** Codes de langue BCP 47 simplifiés : « fr », « fr-FR », « en-US »… */
const BCP47 = /^[a-z]{2,3}(-[A-Za-z0-9]{2,8})*$/

/** Mots outils fréquents, servant à détecter la langue réelle du texte visible. */
const FRENCH_STOPWORDS = ['le', 'la', 'les', 'des', 'une', 'vous', 'pour', 'dans', 'avec', 'votre', 'sur', 'est']
const ENGLISH_STOPWORDS = ['the', 'your', 'with', 'this', 'from', 'about', 'have', 'that', 'will', 'search']

/** 8.1 — type de document présent, valide et situé avant <html>. Les 3 tests sont structurels. */
export const mandatory81: TAnalyzer = {
  criterion: '8.1',
  coversAllTests: true,
  analyze: ({ html }) => {
    const doctypeMatch = html.match(/<!DOCTYPE[^>]*>/i)
    if (!doctypeMatch) return failing('Aucune déclaration de type de document (<!DOCTYPE>) dans la page')

    const doctype = doctypeMatch[0]
    if (!/^<!DOCTYPE\s+html\s*>$/i.test(doctype)) {
      return failing(`Type de document non conforme à HTML5 : ${excerpt(doctype, 60)}`)
    }

    const htmlTagIndex = html.search(/<html[\s>]/i)
    if (htmlTagIndex !== -1 && doctypeMatch.index !== undefined && doctypeMatch.index > htmlTagIndex) {
      return failing('La déclaration de type de document est située après la balise <html>')
    }

    return conforming('<!DOCTYPE html> présent, valide et situé avant la balise <html>')
  },
}

/** 8.3 — langue par défaut présente sur <html>. Test unique et structurel. */
export const mandatory83: TAnalyzer = {
  criterion: '8.3',
  coversAllTests: true,
  analyze: ({ $ }, scope) => {
    const lang = $('html').attr('lang')?.trim()
    if (!lang) return failing('La balise <html> ne porte aucun attribut lang')
    return conforming(`<html lang="${lang}"> (collecte ${scope})`)
  },
}

/**
 * 8.4 — le code de langue doit correspondre à la langue du contenu.
 * Comparaison factuelle entre le lang déclaré et les mots outils du texte visible.
 */
export const mandatory84: TAnalyzer = {
  criterion: '8.4',
  coversAllTests: false,
  analyze: ({ $ }, scope) => {
    const lang = $('html').attr('lang')?.trim().toLowerCase()
    if (!lang) return failing('Aucun attribut lang sur <html> : la pertinence du code de langue ne peut pas être établie')

    const words = $('body')
      .text()
      .toLowerCase()
      .split(/[^a-zàâçéèêëîïôûùüÿñæœ]+/)
      .filter((word) => word.length > 1)
    if (words.length < 40) return conforming(`Trop peu de texte pour établir la langue réelle (${words.length} mots)`)

    const french = words.filter((word) => FRENCH_STOPWORDS.includes(word)).length
    const english = words.filter((word) => ENGLISH_STOPWORDS.includes(word)).length
    const detected = french > english * 2 ? 'fr' : english > french * 2 ? 'en' : null

    if (detected && !lang.startsWith(detected)) {
      return failing(
        `La page est servie avec lang="${lang}" (collecte ${scope}) alors que le texte visible est en « ${detected} » ` +
          `(${french} marqueurs français contre ${english} anglais sur ${words.length} mots)`,
      )
    }

    return conforming(`lang="${lang}" cohérent avec le texte visible (${french} marqueurs fr / ${english} en)`)
  },
}

/** 8.5 — titre de page présent et non vide. Test unique et structurel. */
export const mandatory85: TAnalyzer = {
  criterion: '8.5',
  coversAllTests: true,
  analyze: ({ $ }) => {
    // Next peut émettre le <title> hors du <head> lors du rendu en flux : on cherche partout.
    const titles = $('title').toArray()
    if (titles.length === 0) return failing('Aucune balise <title> dans la page')

    const text = $(titles[0]).text().trim()
    if (!text) return failing('La balise <title> est vide')
    if (titles.length > 1) return failing(`${titles.length} balises <title> dans la page (une seule attendue)`)

    return conforming(`<title> présent : « ${excerpt(text, 90)} »`)
  },
}

/** 8.8 — validité du code de langue de chaque changement de langue. */
export const mandatory88: TAnalyzer = {
  criterion: '8.8',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const tagged = visible($, '[lang]').filter((element) => String($(element).prop('tagName')).toLowerCase() !== 'html')
    if (tagged.length === 0) return notApplicable('Aucun changement de langue (attribut lang) dans le corps de la page')

    const invalid = tagged
      .filter((element) => !BCP47.test($(element).attr('lang')?.trim() ?? ''))
      .map((element) => `${stableSelector($, element)} → lang="${$(element).attr('lang')}"`)

    if (invalid.length > 0) return failing(`Code de langue invalide : ${listExamples(invalid)}`)

    const codes = [...new Set(tagged.map((element) => $(element).attr('lang')))].join(', ')
    return conforming(`${tagged.length} changement(s) de langue, codes valides (${codes}) ; la pertinence reste à vérifier`)
  },
}

/** 8.9 — les balises ne doivent pas être utilisées à des fins de présentation. */
export const mandatory89: TAnalyzer = {
  criterion: '8.9',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const problems: string[] = []

    const emptyEmphasis = visible($, 'i, b, em, strong').filter((element) => $(element).text().trim().length === 0)
    if (emptyEmphasis.length > 0) {
      problems.push(`${emptyEmphasis.length} balise(s) <i>/<b>/<em>/<strong> sans contenu textuel (usage typographique en icône)`)
    }

    const layoutTables = visible($, 'table[role="presentation"], table[role="none"]')
    if (layoutTables.length > 0) problems.push(`${layoutTables.length} tableau(x) de mise en forme`)

    if (problems.length > 0) return failing(problems.join(' ; '))
    return conforming('Aucun détournement structurel évident (balises de mise en valeur vides, tableaux de mise en forme)')
  },
}

/** 8.10 — signalement des changements du sens de lecture. */
export const mandatory810: TAnalyzer = {
  criterion: '8.10',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const withDir = visible($, '[dir]').filter((element) => String($(element).prop('tagName')).toLowerCase() !== 'html')
    const hasRtlText = /[֐-׿؀-ۿ܀-ݏ]/.test($('body').text())

    if (withDir.length === 0 && !hasRtlText) {
      return notApplicable('Aucun texte en écriture droite-à-gauche ni attribut dir dans le corps de la page')
    }

    const invalid = withDir
      .filter((element) => !['ltr', 'rtl', 'auto'].includes($(element).attr('dir')?.trim() ?? ''))
      .map((element) => `${stableSelector($, element)} → dir="${$(element).attr('dir')}"`)

    if (invalid.length > 0) return failing(`Valeur d'attribut dir non conforme : ${listExamples(invalid)}`)
    if (hasRtlText && withDir.length === 0) return failing('Texte en écriture droite-à-gauche détecté sans attribut dir associé')

    return conforming(`${withDir.length} changement(s) de sens de lecture, valeurs conformes`)
  },
}
