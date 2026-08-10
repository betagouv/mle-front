import { stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

const FRAME_SELECTOR = 'iframe, frame'

/**
 * 2.1 — chaque cadre a-t-il un titre de cadre ?
 * Test unique et purement structurel : l'analyseur couvre l'intégralité du critère.
 */
export const frame21: TAnalyzer = {
  criterion: '2.1',
  coversAllTests: true,
  analyze: ({ $ }) => {
    const frames = visible($, FRAME_SELECTOR)
    if (frames.length === 0) return notApplicable('Aucun cadre (iframe, frame) dans le DOM de la page')

    const untitled = frames
      .filter((element) => !$(element).attr('title')?.trim())
      .map((element) => `${stableSelector($, element)} → ${$(element).attr('src')?.slice(0, 60) ?? 'sans src'}`)

    if (untitled.length > 0) {
      return failing(`${untitled.length} cadre(s) sans attribut title sur ${frames.length} : ${listExamples(untitled)}`)
    }

    const titles = frames.map((element) => `« ${$(element).attr('title')} »`)
    return conforming(`${frames.length} cadre(s), tous pourvus d'un titre : ${listExamples(titles, 4)}`)
  },
}

/** 2.2 — pertinence du titre de cadre : condamne uniquement les titres manifestement vides. */
export const frame22: TAnalyzer = {
  criterion: '2.2',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const frames = visible($, FRAME_SELECTOR)
    if (frames.length === 0) return notApplicable('Aucun cadre dans le DOM de la page')

    const titles = frames.map((element) => $(element).attr('title')?.trim() ?? '')
    const generic = titles.filter((title) => /^(iframe|frame|contenu|embed|widget)?$/i.test(title))

    if (generic.length > 0) {
      return failing(`${generic.length} cadre(s) au titre absent ou générique sur ${frames.length}`)
    }

    return conforming(
      `Titres de cadre présents et non génériques : ${listExamples(
        titles.map((t) => `« ${t} »`),
        4,
      )} ; pertinence à confirmer`,
    )
  },
}
