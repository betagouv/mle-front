import type { TAutoResult } from './analyzers'
import type { TCriterion } from './referential'
import type { TAuditCell, TAuditPage, TAuditSheet, TRgaaFinding, TRgaaOrigin, TRgaaPriority, TRgaaStatus } from './types'

/** Un statut plus grave l'emporte quand plusieurs constats visent le même critère. */
const STATUS_RANK: Record<TRgaaStatus, number> = { NC: 3, NT: 2, NA: 1, C: 0 }
const PRIORITY_RANK: Record<TRgaaPriority, number> = { P1: 3, P2: 2, P3: 1 }

const UNTESTED_OBSERVATION = 'Non évalué automatiquement — voir la feuille « Protocole manuel »'

export type TMergeInput = {
  page: TAuditPage
  criteria: TCriterion[]
  autoResults: TAutoResult[]
  expertFindings: TRgaaFinding[]
  /** Constats du gabarit, propagés dans chaque feuille page pour la rendre auto-suffisante. */
  templateFindings: TRgaaFinding[]
}

function formatFinding(finding: TRgaaFinding, isTemplate: boolean): string {
  const parts: string[] = ["Constat d'audit —"]
  if (isTemplate) parts.push('[gabarit]')
  if (finding.scope) parts.push(`[${finding.scope}]`)
  parts.push(finding.observation)
  if (finding.location) parts.push(`\n→ ${finding.location}`)
  return parts.join(' ')
}

/**
 * Fusionne les trois couches dans l'ordre : socle « non testé », détection automatique,
 * puis jugement d'expert. Trois garde-fous protègent l'honnêteté du résultat :
 *   - un constat expert ne peut pas déclarer conforme un critère condamné automatiquement
 *     sans motif explicite (overrides.reason) ;
 *   - un constat propagé depuis le gabarit ne peut pas condamner un critère que l'analyseur
 *     a déclaré non applicable, faute de l'objet visé dans le DOM de la page ; tout autre
 *     conflit avec un « non applicable » est signalé sans bloquer ;
 *   - un constat expert visant un critère jugé conforme par un analyseur intégral est
 *     signalé comme potentiellement obsolète (le code a peut-être été corrigé).
 */
export function mergeSheet({ page, criteria, autoResults, expertFindings, templateFindings }: TMergeInput): {
  sheet: TAuditSheet
  warnings: string[]
} {
  const warnings: string[] = []
  const autoByCriterion = new Map(autoResults.map((result) => [result.criterion, result]))

  const expertByCriterion = new Map<string, { finding: TRgaaFinding; fromTemplate: boolean }[]>()
  const collect = (findings: TRgaaFinding[], fromTemplate: boolean) => {
    for (const finding of findings) {
      expertByCriterion.set(finding.criterion, [...(expertByCriterion.get(finding.criterion) ?? []), { finding, fromTemplate }])
    }
  }
  collect(expertFindings, false)
  // Le gabarit n'hérite pas de lui-même.
  if (!page.isTemplate) collect(templateFindings, true)

  const cells: TAuditCell[] = criteria.map((criterion) => {
    const auto = autoByCriterion.get(criterion.number)
    const experts = expertByCriterion.get(criterion.number) ?? []

    // Couche 0 puis couche 1.
    let status: TRgaaStatus = auto?.status ?? 'NT'
    let origin: TRgaaOrigin = auto ? 'automatique' : 'non testé'
    const observations = auto ? [`Analyse automatique — ${auto.observation}`] : [UNTESTED_OBSERVATION]
    const remediations: string[] = auto?.remediation ? [auto.remediation] : []
    let priority: TRgaaPriority | undefined = auto?.priority
    let fullyCovered = auto?.fullyCovered ?? false

    if (experts.length === 0) {
      return { criterion: criterion.number, status, origin, observations, remediations, priority, fullyCovered }
    }

    // Couche 2 : le jugement d'expert écrase, sous conditions.
    for (const { finding, fromTemplate } of experts) {
      if (finding.status === 'C' && auto?.status === 'NC' && !finding.overrides) {
        throw new Error(
          `Fusion impossible — page « ${page.id} », critère ${criterion.number} : un constat expert déclare « Conforme » ` +
            "un critère condamné par l'analyse automatique. Ajoutez overrides.reason pour justifier cette promotion.",
        )
      }

      // « Non applicable » repose sur une observation vérifiable : l'objet visé est absent du
      // DOM. Un constat propagé qui l'écrase condamne des pages où le défaut ne peut pas
      // exister, gonfle le nombre de non-conformités de tout le classeur et fait remonter le
      // critère en tête des actions prioritaires. Un tel constat appartient au fichier de la
      // page qui porte réellement le défaut.
      const aggravatesNotApplicable = auto?.status === 'NA' && STATUS_RANK[finding.status] > STATUS_RANK.NA

      if (aggravatesNotApplicable) {
        if (fromTemplate && finding.status === 'NC' && !finding.overrides) {
          throw new Error(
            `Fusion impossible — page « ${page.id} », critère ${criterion.number} : un constat du gabarit condamne ` +
              `un critère que l'analyse automatique juge non applicable (${auto?.observation}). Déplacez ce constat ` +
              'dans le fichier de la page concernée, ou ajoutez overrides.reason si le défaut vaut pour toutes les pages.',
          )
        }

        // Les autres conflits n'inventent pas de non-conformité mais effacent une conclusion
        // acquise : ils sont signalés sans bloquer, car l'analyseur ne voit ni les widgets
        // rendus après hydratation, ni le contenu conditionné par les données.
        warnings.push(
          `Page « ${page.id} », critère ${criterion.number} : constat ${fromTemplate ? 'du gabarit' : 'expert'} ` +
            `« ${finding.status} » sur un critère que l'analyse automatique juge non applicable (${auto?.observation}) — ` +
            "vérifiez que l'objet visé est bien présent dans l'échantillon collecté.",
        )
      }

      if (auto?.status === 'C' && auto.fullyCovered) {
        warnings.push(
          `Page « ${page.id} », critère ${criterion.number} : constat expert potentiellement obsolète — ` +
            "l'analyse automatique, qui couvre l'intégralité des tests de ce critère, le juge désormais conforme.",
        )
      }

      // Un override motivé impose son statut ; sinon, le statut le plus grave l'emporte.
      if (finding.overrides || STATUS_RANK[finding.status] >= STATUS_RANK[status]) status = finding.status
      observations.push(formatFinding(finding, fromTemplate))
      if (finding.remediation) remediations.push(fromTemplate ? `[gabarit] ${finding.remediation}` : finding.remediation)
      if (finding.priority && (!priority || PRIORITY_RANK[finding.priority] > PRIORITY_RANK[priority])) priority = finding.priority
    }

    // Le socle « non testé » n'a plus lieu d'être dès qu'un expert s'est prononcé.
    if (!auto) observations.shift()

    // Lecture : quand le critère est non conforme du fait de l'expert, c'est ce constat
    // qui doit ouvrir la cellule, pas le relevé automatique qui n'a rien vu.
    if (status === 'NC' && auto && auto.status !== 'NC') observations.push(observations.shift() as string)

    origin = auto ? 'automatique + expert' : 'expert'
    // Un statut issu d'un jugement d'expert n'est jamais « intégralement couvert par un analyseur ».
    fullyCovered = false

    if (status !== 'NC') priority = undefined

    return { criterion: criterion.number, status, origin, observations, remediations, priority, fullyCovered }
  })

  return {
    sheet: { pageId: page.id, sheetName: page.sheetName, label: page.label, isTemplate: page.isTemplate, cells },
    warnings,
  }
}
