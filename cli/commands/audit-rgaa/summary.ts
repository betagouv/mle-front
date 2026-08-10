import { compareCriteria, type TCriterion } from './referential'
import type { TAuditSheet, TManualCampaign, TManualTask, TPageRates, TRgaaStatus } from './types'

const EMPTY_COUNTS = (): Record<TRgaaStatus, number> => ({ C: 0, NC: 0, NA: 0, NT: 0 })

/**
 * Trois chiffres, jamais un seul. Publier le seul taux officiel alors qu'une large part
 * du référentiel reste non testée le flatterait mécaniquement.
 */
export function computeRates(sheets: TAuditSheet[], criteriaCount: number): TPageRates[] {
  return sheets
    .filter((sheet) => !sheet.isTemplate)
    .map((sheet) => {
      const counts = EMPTY_COUNTS()
      for (const cell of sheet.cells) counts[cell.status]++

      const tested = counts.C + counts.NC
      return {
        pageId: sheet.pageId,
        label: sheet.label,
        counts,
        provisional: tested > 0 ? counts.C / tested : null,
        floor: counts.C / (tested + counts.NT || 1),
        coverage: (counts.C + counts.NC + counts.NA) / criteriaCount,
      }
    })
}

export type TTopAction = {
  criterion: string
  title: string
  topic: string
  priority: string
  pages: string[]
  remediation: string
}

/** Actions classées par priorité puis par nombre de pages touchées. */
export function computeTopActions(sheets: TAuditSheet[], criteria: TCriterion[], limit = 15): TTopAction[] {
  const byCriterion = new Map<string, TTopAction>()

  for (const sheet of sheets) {
    if (sheet.isTemplate) continue
    for (const cell of sheet.cells) {
      if (cell.status !== 'NC') continue
      const criterion = criteria.find((item) => item.number === cell.criterion)
      if (!criterion) continue

      const existing = byCriterion.get(cell.criterion)
      if (existing) {
        existing.pages.push(sheet.label)
        if (cell.priority && cell.priority < existing.priority) existing.priority = cell.priority
        continue
      }

      byCriterion.set(cell.criterion, {
        criterion: cell.criterion,
        title: criterion.title,
        topic: criterion.topic,
        priority: cell.priority ?? 'P3',
        pages: [sheet.label],
        remediation: cell.remediations[0] ?? '',
      })
    }
  }

  return [...byCriterion.values()].sort((a, b) => a.priority.localeCompare(b.priority) || b.pages.length - a.pages.length).slice(0, limit)
}

/**
 * Outil de contrôle recommandé, par thématique RGAA. C'est aussi la clé de regroupement des
 * campagnes : deux critères qui partagent un outil s'éprouvent dans la même session. Les
 * thématiques déjà servies par le cahier de relevés y renvoient — la liste est faite, il
 * reste à la juger, ce qui est bien plus rapide que de réinspecter chaque page.
 */
function toolingFor(topicNumber: number): string {
  switch (topicNumber) {
    case 1:
      return 'Relevé - images + inspecteur DOM'
    case 2:
      return 'Inspecteur DOM (cadres)'
    case 3:
      return 'WCAG Color contrast checker + inspecteur de styles'
    case 4:
      return 'Lecture du média + contrôle des sous-titres et de la transcription'
    case 5:
      return 'Relevé - tableaux + inspecteur DOM'
    case 6:
      return 'Relevé - liens + lecture du contexte'
    case 7:
      return 'NVDA / VoiceOver + navigation clavier'
    case 8:
      return 'Relevé - pages + validateur W3C'
    case 9:
      return 'Headings Map + VoiceOver (rotor des titres)'
    case 10:
      return 'Zoom navigateur 200 %, fenêtre réduite à 320 px, feuille de styles désactivée'
    case 11:
      return 'Relevé - champs + NVDA / VoiceOver'
    case 12:
      return 'Navigation à la tabulation seule'
    case 13:
      return 'Test manuel du parcours concerné'
    default:
      return 'VoiceOver + WAVE'
  }
}

/** Une ligne par (page, critère) restant à tester à la main, avec la méthodologie officielle. */
export function buildManualProtocol(sheets: TAuditSheet[], criteria: TCriterion[], methodologies: Record<string, string>): TManualTask[] {
  const tasks: TManualTask[] = []

  for (const sheet of sheets) {
    for (const cell of sheet.cells) {
      if (cell.status !== 'NT') continue
      const criterion = criteria.find((item) => item.number === cell.criterion)
      if (!criterion) continue

      const methodology = Object.keys(criterion.tests)
        .map((testNumber) => {
          const text = methodologies[testNumber]
          return text ? `${testNumber} — ${text}` : `${testNumber} — ${criterion.tests[testNumber]}`
        })
        .join('\n\n')

      tasks.push({
        pageId: sheet.pageId,
        pageLabel: sheet.label,
        criterion: criterion.number,
        criterionTitle: criterion.title,
        level: criterion.level,
        topic: `${criterion.topicNumber}. ${criterion.topic}`,
        reason: cell.observations.join('\n'),
        methodology,
        tooling: toolingFor(criterion.topicNumber),
      })
    }
  }

  return tasks
}

/**
 * Regroupe le protocole manuel par critère, sans en retirer une ligne : chaque tâche de
 * `buildManualProtocol` se retrouve dans les `pages` d'exactement une campagne.
 *
 * C'est l'ordre de travail réel d'un auditeur — un critère, un outil, puis les pages où le
 * constat vaut — là où la feuille détaillée reste le décompte page par page exigé par la
 * méthode officielle. Les deux se lisent ensemble, aucune ne remplace l'autre.
 */
export function buildManualCampaigns(tasks: TManualTask[]): TManualCampaign[] {
  const byCriterion = new Map<string, TManualCampaign>()

  for (const task of tasks) {
    const campaign = byCriterion.get(task.criterion)
    if (!campaign) {
      byCriterion.set(task.criterion, {
        tooling: task.tooling,
        topic: task.topic,
        criterion: task.criterion,
        criterionTitle: task.criterionTitle,
        level: task.level,
        pages: [task.pageLabel],
        reasons: [{ reason: task.reason, pages: [task.pageLabel] }],
        methodology: task.methodology,
      })
      continue
    }

    campaign.pages.push(task.pageLabel)
    // Un motif identique sur plusieurs pages ne vaut qu'une lecture : on liste les pages en face.
    const sameReason = campaign.reasons.find((entry) => entry.reason === task.reason)
    if (sameReason) sameReason.pages.push(task.pageLabel)
    else campaign.reasons.push({ reason: task.reason, pages: [task.pageLabel] })
  }

  return [...byCriterion.values()].sort((a, b) => a.tooling.localeCompare(b.tooling) || compareCriteria(a.criterion, b.criterion))
}

/** Tableau croisé statut × thématique, repris de la grille d'audit officielle DINUM. */
export function computeTopicBreakdown(
  sheets: TAuditSheet[],
  criteria: TCriterion[],
): { topic: string; counts: Record<TRgaaStatus, number> }[] {
  const topicOf = new Map(criteria.map((criterion) => [criterion.number, `${criterion.topicNumber}. ${criterion.topic}`]))
  const breakdown = new Map<string, Record<TRgaaStatus, number>>()

  for (const sheet of sheets) {
    if (sheet.isTemplate) continue
    for (const cell of sheet.cells) {
      const topic = topicOf.get(cell.criterion) ?? '?'
      const counts = breakdown.get(topic) ?? EMPTY_COUNTS()
      counts[cell.status]++
      breakdown.set(topic, counts)
    }
  }

  return [...breakdown.entries()]
    .map(([topic, counts]) => ({ topic, counts }))
    .sort((a, b) => Number(a.topic.split('.')[0]) - Number(b.topic.split('.')[0]))
}
