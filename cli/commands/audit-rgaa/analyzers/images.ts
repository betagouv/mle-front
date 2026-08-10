import { excerpt, isResponsiveDuplicate, stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

const IMAGE_SELECTOR = 'img, svg, area, input[type="image"], [role="img"], object[type^="image"]'

/**
 * 1.1 — alternative textuelle des images porteuses d'information.
 * L'analyseur ne sait pas juger si une image est porteuse d'information : il condamne
 * uniquement l'absence totale d'alternative, jamais la pertinence de celle-ci.
 */
export const image11: TAnalyzer = {
  criterion: '1.1',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const images = visible($, IMAGE_SELECTOR)
    if (images.length === 0) return notApplicable('Aucune image (img, svg, area, input[type=image], [role=img]) dans le DOM de la page')

    const withoutAlternative: string[] = []

    for (const element of images) {
      const $element = $(element)
      const tag = String($element.prop('tagName')).toLowerCase()

      const hasAria = Boolean($element.attr('aria-label')?.trim() || $element.attr('aria-labelledby')?.trim())
      const hasTitle = Boolean($element.attr('title')?.trim())
      const isDecorative =
        $element.attr('aria-hidden') === 'true' || $element.attr('role') === 'presentation' || $element.attr('role') === 'none'

      if (isDecorative) continue

      if (tag === 'img' || tag === 'area' || tag === 'input') {
        // alt="" est une alternative valide (image de décoration) : c'est le critère 1.2 qui la juge.
        if ($element.attr('alt') === undefined && !hasAria && !hasTitle) {
          withoutAlternative.push(`${stableSelector($, element)} (${tag} sans alt ni aria-label)`)
        }
        continue
      }

      if (tag === 'svg') {
        const hasSvgTitle = $element.find('title').first().text().trim().length > 0
        if (!hasSvgTitle && !hasAria && $element.attr('role') !== 'img') {
          withoutAlternative.push(`${stableSelector($, element)} (svg sans <title>, aria-label ni role="img")`)
        }
        continue
      }

      if (!hasAria && !hasTitle) {
        withoutAlternative.push(`${stableSelector($, element)} (${tag} sans nom accessible)`)
      }
    }

    if (withoutAlternative.length > 0) {
      return failing(
        `${withoutAlternative.length} élément(s) graphique(s) sans aucune alternative sur ${images.length} : ${listExamples(withoutAlternative)}`,
      )
    }

    return conforming(
      `${images.length} élément(s) graphique(s) contrôlé(s), tous pourvus d'une alternative ou explicitement décoratifs ; la pertinence des alternatives reste à juger`,
    )
  },
}

/**
 * 1.2 — les images de décoration doivent être ignorées par les technologies d'assistance.
 * Condamne les contradictions certaines : alt="" accompagné d'un title ou d'un aria-label.
 */
export const image12: TAnalyzer = {
  criterion: '1.2',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const images = visible($, IMAGE_SELECTOR)
    if (images.length === 0) return notApplicable('Aucune image dans le DOM de la page')

    const contradictions: string[] = []
    const duplicates: string[] = []
    const altCounts = new Map<string, number>()

    for (const element of images) {
      const $element = $(element)
      const alt = $element.attr('alt')

      if (alt === '' && ($element.attr('title')?.trim() || $element.attr('aria-label')?.trim())) {
        contradictions.push(`${stableSelector($, element)} (alt="" mais title/aria-label renseigné)`)
      }

      if (alt && alt.trim().length > 0 && !isResponsiveDuplicate($, element)) {
        const key = alt.trim().toLowerCase()
        altCounts.set(key, (altCounts.get(key) ?? 0) + 1)
      }
    }

    for (const [alt, count] of altCounts) {
      if (count >= 3) duplicates.push(`« ${excerpt(alt, 40)} » (${count} fois)`)
    }

    if (contradictions.length > 0) {
      return failing(`Image déclarée décorative mais exposée aux technologies d'assistance : ${listExamples(contradictions)}`)
    }

    const note = duplicates.length > 0 ? ` Alternatives identiques répétées, à vérifier : ${listExamples(duplicates, 4)}.` : ''
    return conforming(`Aucune contradiction alt=""/title détectée sur ${images.length} image(s).${note}`)
  },
}
