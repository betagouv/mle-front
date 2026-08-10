import { excerpt, stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

/** Champs de formulaire exposés à l'utilisateur (les types techniques sont exclus). */
const FIELD_SELECTOR = 'input:not([type="hidden"]):not([type="submit"]):not([type="button"]):not([type="reset"]), select, textarea'

/**
 * Champs concernés par l'autocomplétion HTML (RGAA 11.13 / WCAG 1.3.5).
 * `name` seul est volontairement absent du motif : il apparaît dans les identifiants générés
 * par le DSFR (`radio-name-…`) et faisait passer des groupes de boutons radio pour des champs
 * d'identité.
 */
const IDENTITY_FIELD_PATTERN = /(email|mail|\btel\b|phone|firstname|lastname|prenom|username|address|adresse|postal|zip|city|ville|birth)/i

/** Types de champs auxquels la finalité de saisie (WCAG 1.3.5) ne s'applique pas. */
const NON_IDENTITY_TYPES = ['radio', 'checkbox', 'range', 'file', 'color']

/** 11.1 — chaque champ de formulaire a-t-il une étiquette ? */
export const form111: TAnalyzer = {
  criterion: '11.1',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const fields = visible($, FIELD_SELECTOR)
    if (fields.length === 0) return notApplicable('Aucun champ de formulaire dans le DOM de la page')

    const unlabelled: string[] = []
    const brokenFor: string[] = []
    const placeholderOnly: string[] = []

    for (const element of fields) {
      const $element = $(element)
      const id = $element.attr('id')
      const labelFor = id ? $(`label[for="${id.replace(/"/g, '\\"')}"]`) : null

      const hasLabelFor = Boolean(labelFor && labelFor.length > 0 && labelFor.text().trim())
      const hasWrappingLabel = $element.parents('label').length > 0 && $element.parents('label').first().text().trim().length > 0
      const hasAria = Boolean($element.attr('aria-label')?.trim() || $element.attr('aria-labelledby')?.trim())
      const hasTitle = Boolean($element.attr('title')?.trim())

      if (!hasLabelFor && !hasWrappingLabel && !hasAria && !hasTitle) {
        const placeholder = $element.attr('placeholder')?.trim()
        if (placeholder) {
          placeholderOnly.push(`${stableSelector($, element)} (placeholder « ${excerpt(placeholder, 35)} » seul)`)
        } else {
          unlabelled.push(stableSelector($, element))
        }
      }

      if (id && labelFor && labelFor.length > 1) brokenFor.push(`${id} référencé par ${labelFor.length} <label for>`)
    }

    const problems: string[] = []
    if (unlabelled.length > 0) problems.push(`${unlabelled.length} champ(s) sans aucune étiquette : ${listExamples(unlabelled)}`)
    if (placeholderOnly.length > 0) {
      problems.push(`${placeholderOnly.length} champ(s) dont le placeholder tient lieu d'étiquette : ${listExamples(placeholderOnly)}`)
    }
    if (brokenFor.length > 0) problems.push(`association label/for ambiguë : ${listExamples(brokenFor)}`)

    if (problems.length > 0) return failing(`${problems.join(' ; ')} (sur ${fields.length} champ(s))`)

    return conforming(
      `${fields.length} champ(s) de formulaire, tous pourvus d'une étiquette ; la visibilité et la proximité de chaque étiquette restent à vérifier`,
    )
  },
}

/** 11.5 — regroupement des champs de même nature (boutons radio, cases à cocher). */
export const form115: TAnalyzer = {
  criterion: '11.5',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const grouped = visible($, 'input[type="radio"][name], input[type="checkbox"][name]')
    if (grouped.length === 0) return notApplicable('Aucun groupe de boutons radio ou de cases à cocher dans le DOM de la page')

    const byName = new Map<string, number>()
    const ungrouped = new Set<string>()

    for (const element of grouped) {
      const name = $(element).attr('name') ?? ''
      byName.set(name, (byName.get(name) ?? 0) + 1)
      if ($(element).closest('fieldset, [role="group"], [role="radiogroup"]').length === 0) ungrouped.add(name)
    }

    const faulty = [...ungrouped].filter((name) => (byName.get(name) ?? 0) >= 2)
    if (faulty.length > 0) {
      return failing(
        `${faulty.length} groupe(s) de champs de même nature hors <fieldset>/role="group" : ${listExamples(faulty.map((n) => `name="${n}"`))}`,
      )
    }

    return conforming(`${byName.size} groupe(s) de champs de même nature, tous regroupés dans un <fieldset> ou un role="group"`)
  },
}

/** Attributs par lesquels un champ peut, à lui seul, rattacher sa saisie à un groupe (11.6.1 §3). */
const FIELD_GROUPING_ATTRIBUTES = ['title', 'aria-label', 'aria-labelledby', 'aria-describedby']

/**
 * 11.6 — chaque regroupement de champs a-t-il une légende ?
 *
 * La méthodologie 11.6.1 admet trois formes : `<fieldset>` + `<legend>`, `role="group"` ou
 * `"radiogroup"` + `aria-label(ledby)`, et à défaut un rattachement porté par chaque champ.
 * L'analyseur les reconnaît toutes les trois, mais reste partiel : identifier ce qui constitue
 * un « groupe de champs de même nature » est un jugement, et un groupe qui n'est matérialisé
 * par aucun conteneur lui échappe entièrement.
 */
export const form116: TAnalyzer = {
  criterion: '11.6',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const groups = visible($, 'fieldset, [role="group"], [role="radiogroup"]')
    if (groups.length === 0) {
      return notApplicable('Aucun regroupement de champs (<fieldset>, role="group" ou "radiogroup") dans le DOM de la page')
    }

    const unlabelled = groups
      .filter((element) => {
        const $element = $(element)
        const labelled =
          $element.is('fieldset') && $element.children('legend').text().trim().length > 0
            ? true
            : Boolean($element.attr('aria-label')?.trim() || $element.attr('aria-labelledby')?.trim())
        if (labelled) return false

        // Repli de la méthodologie : à défaut d'intitulé sur le conteneur, chaque champ peut
        // porter lui-même son rattachement au groupe.
        const fields = $element.find(FIELD_SELECTOR).toArray()
        if (fields.length === 0) return true
        return !fields.every((field) => FIELD_GROUPING_ATTRIBUTES.some((attribute) => $(field).attr(attribute)?.trim()))
      })
      .map((element) => stableSelector($, element))

    if (unlabelled.length > 0) {
      return failing(
        `${unlabelled.length} regroupement(s) sans intitulé sur ${groups.length}, ni <legend>, ni aria-label(ledby), ` +
          `ni rattachement porté par les champs : ${listExamples(unlabelled)}`,
      )
    }

    return conforming(`${groups.length} regroupement(s) de champs, tous pourvus d'un intitulé ; la pertinence des légendes reste à juger`)
  },
}

/** 11.8 — regroupement pertinent des items d'une liste de choix. */
export const form118: TAnalyzer = {
  criterion: '11.8',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const selects = visible($, 'select')
    if (selects.length === 0) return notApplicable('Aucune liste de choix (<select>) dans le DOM de la page')

    const optgroups = visible($, 'optgroup')
    if (optgroups.length === 0) {
      return conforming(`${selects.length} liste(s) de choix sans <optgroup> ; la nécessité d'un regroupement reste à juger`)
    }

    const withoutLabel = optgroups.filter((element) => !$(element).attr('label')?.trim()).map((element) => stableSelector($, element))

    if (withoutLabel.length > 0) return failing(`${withoutLabel.length} <optgroup> sans attribut label : ${listExamples(withoutLabel)}`)

    return conforming(`${optgroups.length} <optgroup>, tous pourvus d'un label ; la pertinence du regroupement reste à juger`)
  },
}

/** 11.10 — contrôle de saisie. Condamne les références ARIA pointant dans le vide. */
export const form1110: TAnalyzer = {
  criterion: '11.10',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const fields = visible($, FIELD_SELECTOR)
    if (fields.length === 0) return notApplicable('Aucun champ de formulaire dans le DOM de la page')

    const orphans: string[] = []

    for (const attribute of ['aria-describedby', 'aria-labelledby', 'aria-errormessage']) {
      for (const element of visible($, `[${attribute}]`)) {
        const missing = ($(element).attr(attribute) ?? '')
          .split(/\s+/)
          .filter((id) => id && $(`#${id.replace(/([^\w-])/g, '\\$1')}`).length === 0)
        if (missing.length > 0) orphans.push(`${stableSelector($, element)} → ${attribute}="${missing.join(' ')}" (id inexistant)`)
      }
    }

    if (orphans.length > 0) return failing(`Référence ARIA pointant vers un identifiant inexistant : ${listExamples(orphans)}`)

    const required = visible($, '[required], [aria-required="true"]').length
    return conforming(
      `Aucune référence ARIA orpheline sur ${fields.length} champ(s) ; ${required} champ(s) déclarés obligatoires. ` +
        'Le contrôle de saisie proprement dit (messages, suggestions de correction) reste à tester manuellement',
    )
  },
}

/** 11.13 — la finalité d'un champ de saisie doit pouvoir être déduite (autocomplete). */
export const form1113: TAnalyzer = {
  criterion: '11.13',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const identityFields = visible($, FIELD_SELECTOR).filter((element) => {
      const $element = $(element)
      const type = $element.attr('type') ?? ''
      if (NON_IDENTITY_TYPES.includes(type)) return false
      const signature = `${$element.attr('name') ?? ''} ${$element.attr('id') ?? ''} ${type}`
      return ['email', 'tel'].includes(type) || IDENTITY_FIELD_PATTERN.test(signature)
    })

    if (identityFields.length === 0) {
      return notApplicable("Aucun champ collectant une information relative à l'utilisateur dans le DOM de la page")
    }

    const withoutAutocomplete = identityFields
      .filter((element) => {
        const value = $(element).attr('autocomplete')?.trim().toLowerCase()
        return !value || value === 'off'
      })
      .map((element) => `${stableSelector($, element)} (name="${$(element).attr('name') ?? ''}")`)

    if (withoutAutocomplete.length > 0) {
      return failing(
        `${withoutAutocomplete.length} champ(s) d'identité sur ${identityFields.length} sans attribut autocomplete exploitable : ${listExamples(withoutAutocomplete)}`,
      )
    }

    return conforming(`${identityFields.length} champ(s) d'identité, tous pourvus d'un attribut autocomplete`)
  },
}
