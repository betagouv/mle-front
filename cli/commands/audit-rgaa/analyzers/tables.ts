import type { CheerioAPI } from 'cheerio'
import type { TNode } from '../dom'
import { stableSelector, visible } from '../dom'
import { conforming, failing, listExamples, notApplicable, type TAnalyzer } from './contract'

const VALID_SCOPES = new Set(['row', 'col', 'rowgroup', 'colgroup'])

function dataTables($: CheerioAPI): TNode[] {
  return visible($, 'table').filter((element) => {
    const role = $(element).attr('role')
    return role !== 'presentation' && role !== 'none'
  })
}

/**
 * 5.4 — pour chaque tableau de données AYANT un titre, le titre est-il correctement associé ?
 * L'absence de <caption> n'est pas en soi une non-conformité 5.4 : un tableau peut n'avoir
 * aucun titre. L'analyseur ne peut donc pas condamner l'absence — il la signale.
 */
export const table54: TAnalyzer = {
  criterion: '5.4',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const tables = dataTables($)
    if (tables.length === 0) return notApplicable('Aucun tableau de données dans le DOM de la page')

    const withoutCaption = tables
      .filter((element) => $(element).children('caption').text().trim().length === 0)
      .map((element) => stableSelector($, element))

    if (withoutCaption.length === 0) {
      return conforming(`${tables.length} tableau(x) de données, tous pourvus d'un <caption> associé`)
    }

    return conforming(
      `${withoutCaption.length} tableau(x) sur ${tables.length} sans <caption> : ${listExamples(withoutCaption)}. ` +
        "Si l'un d'eux possède un titre visible hors du tableau, le critère est non conforme — à vérifier au rendu",
    )
  },
}

/** 5.6 — en-têtes de colonnes et de lignes déclarés. Condamne l'absence totale d'en-tête. */
export const table56: TAnalyzer = {
  criterion: '5.6',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const tables = dataTables($)
    if (tables.length === 0) return notApplicable('Aucun tableau de données dans le DOM de la page')

    const headerless = tables
      .filter((element) => $(element).find('th, [role="columnheader"], [role="rowheader"]').length === 0)
      .map((element) => stableSelector($, element))

    if (headerless.length > 0) {
      return failing(`${headerless.length} tableau(x) de données sans aucun en-tête (<th> ou role) : ${listExamples(headerless)}`)
    }

    return conforming(
      `${tables.length} tableau(x) de données, tous pourvus d'en-têtes ; la portée exacte de chaque en-tête reste à vérifier`,
    )
  },
}

/** 5.7 — association cellules/en-têtes. Condamne les scope invalides et les headers orphelins. */
export const table57: TAnalyzer = {
  criterion: '5.7',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const tables = dataTables($)
    if (tables.length === 0) return notApplicable('Aucun tableau de données dans le DOM de la page')

    const problems: string[] = []

    for (const table of tables) {
      $(table)
        .find('th[scope]')
        .toArray()
        .forEach((th) => {
          const scope = $(th).attr('scope') ?? ''
          if (!VALID_SCOPES.has(scope)) problems.push(`${stableSelector($, th)} → scope="${scope}" invalide`)
        })

      $(table)
        .find('[headers]')
        .toArray()
        .forEach((cell) => {
          const orphans = ($(cell).attr('headers') ?? '')
            .split(/\s+/)
            .filter((id) => id && $(table).find(`#${id.replace(/([^\w-])/g, '\\$1')}`).length === 0)
          if (orphans.length > 0) problems.push(`${stableSelector($, cell)} → headers pointe vers ${orphans.join(', ')} (id inexistant)`)
        })
    }

    if (problems.length > 0) return failing(`Association en-têtes/cellules défaillante : ${listExamples(problems)}`)

    const withScope = $('th[scope]').length
    return conforming(`${tables.length} tableau(x) ; ${withScope} <th scope> valide(s), aucun attribut headers orphelin`)
  },
}

/** 5.8 — un tableau de mise en forme ne doit pas utiliser les éléments des tableaux de données. */
export const table58: TAnalyzer = {
  criterion: '5.8',
  coversAllTests: false,
  analyze: ({ $ }) => {
    const allTables = visible($, 'table')
    if (allTables.length === 0) return notApplicable('Aucun tableau dans le DOM de la page')

    const layoutTables = allTables.filter((element) => {
      const role = $(element).attr('role')
      return role === 'presentation' || role === 'none'
    })

    const faulty = layoutTables
      .filter((element) => $(element).find('th, caption, thead, tfoot').length > 0 || Boolean($(element).attr('summary')?.trim()))
      .map((element) => stableSelector($, element))

    if (faulty.length > 0) {
      return failing(`${faulty.length} tableau(x) de mise en forme utilisant des éléments de tableau de données : ${listExamples(faulty)}`)
    }

    if (layoutTables.length === 0) {
      return conforming(
        `Aucun tableau explicitement déclaré de mise en forme (role="presentation") parmi ${allTables.length} tableau(x) ; ` +
          'la nature de chaque tableau reste à confirmer au rendu',
      )
    }

    return conforming(`${layoutTables.length} tableau(x) de mise en forme, aucun n'utilise <th>, <caption>, <thead>, <tfoot> ou summary`)
  },
}
