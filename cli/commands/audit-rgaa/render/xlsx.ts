import ExcelJS from 'exceljs'
import type { TCriterion } from '../referential'
import type { TReviewFamily } from '../review/extract'
import { computeTopActions, computeTopicBreakdown } from '../summary'
import { RGAA_PRIORITIES, STATUS_LABELS, type TAuditSheet, type TRgaaStatus, type TWorkbookModel } from '../types'

/** Teintes reprises de la palette DSFR, pour rester cohérent avec le produit audité. */
const STATUS_FILLS: Record<TRgaaStatus, string> = {
  C: 'FFB8FEC9',
  NC: 'FFFFE9E9',
  NA: 'FFEEEEEE',
  NT: 'FFFFE8C8',
}

const HEADER_FILL = 'FFF5F5FE'
const STATUS_LIST = Object.values(STATUS_LABELS).join(',')

function styleHeader(sheet: ExcelJS.Worksheet): void {
  const header = sheet.getRow(1)
  header.font = { bold: true }
  header.alignment = { vertical: 'middle', wrapText: true }
  header.height = 30
  header.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF929292' } } }
  })
  sheet.views = [{ state: 'frozen', ySplit: 1 }]
}

function addTitleBlock(sheet: ExcelJS.Worksheet, lines: [string, string][]): void {
  for (const [label, value] of lines) sheet.addRow([label, value])
  sheet.getColumn(1).font = { bold: true }
}

function renderCriteriaSheet(workbook: ExcelJS.Workbook, auditSheet: TAuditSheet, criteria: TCriterion[]): void {
  const sheet = workbook.addWorksheet(auditSheet.sheetName)

  sheet.columns = [
    { header: 'Thématique', key: 'topic', width: 20 },
    { header: 'N°', key: 'criterion', width: 8 },
    { header: 'Critère', key: 'title', width: 68 },
    { header: 'Niveau', key: 'level', width: 8 },
    { header: 'Statut', key: 'status', width: 22 },
    { header: 'Origine', key: 'origin', width: 18 },
    { header: 'Constat', key: 'observation', width: 90 },
    { header: 'Résolution', key: 'remediation', width: 90 },
    { header: 'Priorité', key: 'priority', width: 10 },
  ]

  const criterionByNumber = new Map(criteria.map((criterion) => [criterion.number, criterion]))
  let previousTopic = ''

  for (const cell of auditSheet.cells) {
    const criterion = criterionByNumber.get(cell.criterion)
    if (!criterion) continue

    const topicLabel = `${criterion.topicNumber}. ${criterion.topic}`
    const row = sheet.addRow({
      topic: topicLabel,
      criterion: cell.criterion,
      title: criterion.title,
      level: criterion.level,
      status: STATUS_LABELS[cell.status],
      origin: cell.origin,
      observation: cell.observations.join('\n\n'),
      remediation: cell.remediations.join('\n\n'),
      priority: cell.priority ?? '',
    })

    row.alignment = { vertical: 'top', wrapText: true }
    row.getCell('status').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_FILLS[cell.status] } }
    row.getCell('status').font = { bold: cell.status === 'NC' }

    // Menus déroulants : l'amendement manuel du classeur reste dans le vocabulaire de la grille.
    row.getCell('status').dataValidation = { type: 'list', allowBlank: false, formulae: [`"${STATUS_LIST}"`] }
    row.getCell('priority').dataValidation = { type: 'list', allowBlank: true, formulae: [`"${RGAA_PRIORITIES.join(',')}"`] }

    if (topicLabel !== previousTopic) {
      row.getCell('topic').font = { bold: true }
      row.eachCell((excelCell) => {
        excelCell.border = { top: { style: 'thin', color: { argb: 'FFCECECE' } } }
      })
      previousTopic = topicLabel
    }
  }

  styleHeader(sheet)
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: 9 } }
}

function renderSummary(workbook: ExcelJS.Workbook, model: TWorkbookModel, criteria: TCriterion[]): void {
  const sheet = workbook.addWorksheet('Synthèse')
  sheet.columns = [{ width: 42 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 70 }]

  sheet.addRow(['Audit RGAA 4.1 — Mon Logement Étudiant']).font = { bold: true, size: 14 }
  addTitleBlock(sheet, [
    ['Date', model.generatedAt.slice(0, 10)],
    ['Commit', model.commit],
    ['URL de base', model.baseUrl],
    ['Référentiel', `RGAA 4.1 (106 critères) — empreinte ${model.referentialSha256.slice(0, 16)}`],
  ])

  sheet.addRow([])
  const warning = sheet.addRow([
    "Lecture : tant que la couverture n'atteint pas 100 %, ce classeur ne peut pas fonder une déclaration d'accessibilité. " +
      'Le taux provisoire ne porte que sur les critères effectivement statués.',
  ])
  warning.font = { italic: true }
  warning.alignment = { wrapText: true }
  sheet.mergeCells(`A${warning.number}:G${warning.number}`)

  sheet.addRow([])
  sheet.addRow(['Taux de conformité par page']).font = { bold: true, size: 12 }
  const ratesHeader = sheet.addRow([
    'Page',
    'Conforme',
    'Non conforme',
    'Non applicable',
    'À vérifier',
    'Taux provisoire',
    'Taux plancher / couverture',
  ])
  ratesHeader.font = { bold: true }
  ratesHeader.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: HEADER_FILL } }
  })

  for (const rate of model.rates) {
    sheet.addRow([
      rate.label,
      rate.counts.C,
      rate.counts.NC,
      rate.counts.NA,
      rate.counts.NT,
      rate.provisional === null ? 'n/a' : `${(rate.provisional * 100).toFixed(1)} %`,
      `plancher ${(rate.floor * 100).toFixed(1)} % — couverture ${(rate.coverage * 100).toFixed(1)} %`,
    ])
  }

  sheet.addRow([])
  sheet.addRow(['Non-conformités légales (décret 2019-768) — hors référentiel RGAA']).font = { bold: true, size: 12 }
  for (const issue of model.legalIssues) {
    const row = sheet.addRow([issue.title, '', '', '', '', '', `${issue.detail}\n→ ${issue.location}\nRésolution : ${issue.remediation}`])
    row.alignment = { vertical: 'top', wrapText: true }
    row.getCell(1).font = { bold: true }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: STATUS_FILLS.NC } }
  }

  sheet.addRow([])
  sheet.addRow(['Répartition par thématique (toutes pages)']).font = { bold: true, size: 12 }
  const topicHeader = sheet.addRow(['Thématique', 'Conforme', 'Non conforme', 'Non applicable', 'À vérifier'])
  topicHeader.font = { bold: true }
  for (const { topic, counts } of computeTopicBreakdown(model.sheets, criteria)) {
    sheet.addRow([topic, counts.C, counts.NC, counts.NA, counts.NT])
  }

  sheet.addRow([])
  sheet.addRow(['Actions prioritaires']).font = { bold: true, size: 12 }
  const actionHeader = sheet.addRow(['Critère', 'Priorité', 'Pages touchées', '', '', '', 'Résolution'])
  actionHeader.font = { bold: true }
  for (const action of computeTopActions(model.sheets, criteria)) {
    const row = sheet.addRow([
      `${action.criterion} — ${action.title}`,
      action.priority,
      `${action.pages.length} page(s) : ${action.pages.join(', ')}`,
      '',
      '',
      '',
      action.remediation,
    ])
    row.alignment = { vertical: 'top', wrapText: true }
  }
}

function renderSample(workbook: ExcelJS.Workbook, model: TWorkbookModel): void {
  const sheet = workbook.addWorksheet('Échantillon')
  sheet.columns = [
    { header: 'N°', key: 'index', width: 6 },
    { header: 'Page', key: 'page', width: 34 },
    { header: 'Écran', key: 'scope', width: 24 },
    { header: 'URL auditée', key: 'url', width: 78 },
    { header: 'Accept-Language', key: 'lang', width: 18 },
    { header: 'HTTP', key: 'status', width: 8 },
    { header: 'Authentifié', key: 'auth', width: 12 },
    { header: 'Angles morts (non concluables automatiquement)', key: 'blind', width: 60 },
  ]

  let index = 0
  for (const page of model.sample) {
    for (const url of page.urls) {
      index++
      sheet.addRow({
        index,
        page: page.label,
        scope: url.scope,
        url: url.url,
        lang: url.acceptLanguage,
        status: url.httpStatus,
        auth: page.auth ? 'oui' : 'non',
        blind: page.blindSpots.join(' ; '),
      })
    }
  }

  sheet.addRow([])
  const notes = [
    "La feuille « Global - gabarit » est une feuille de référence, pas un membre de l'échantillon : ses constats sont propagés dans les feuilles page et elle est exclue du calcul des taux.",
    'Audit réalisé sur le thème clair (le DSFR sert data-fr-scheme="light" par défaut). Le thème sombre relève du protocole manuel.',
    "Le HTML analysé est celui rendu par le serveur : les composants rendus uniquement côté client (carte Leaflet, graphique Recharts) n'y figurent pas et sont déclarés en angles morts.",
    'Le niveau ne prend que les valeurs A et AA : le RGAA 4.1 ne transpose pas les critères WCAG de niveau AAA.',
  ]
  for (const note of notes) {
    const row = sheet.addRow([note])
    row.alignment = { wrapText: true, vertical: 'top' }
    sheet.mergeCells(`A${row.number}:H${row.number}`)
  }

  styleHeader(sheet)
}

function renderManualProtocol(workbook: ExcelJS.Workbook, model: TWorkbookModel): void {
  const sheet = workbook.addWorksheet('Protocole manuel')
  sheet.columns = [
    { header: 'Fait', key: 'done', width: 6 },
    { header: 'Page', key: 'page', width: 30 },
    { header: 'Thématique', key: 'topic', width: 22 },
    { header: 'N°', key: 'criterion', width: 8 },
    { header: 'Critère', key: 'title', width: 62 },
    { header: 'Niveau', key: 'level', width: 8 },
    { header: 'Outil', key: 'tooling', width: 34 },
    { header: "Pourquoi ce critère n'a pas pu être statué automatiquement", key: 'reason', width: 70 },
    { header: 'Méthodologie officielle RGAA', key: 'methodology', width: 100 },
  ]

  for (const task of model.manualTasks) {
    const row = sheet.addRow({
      done: '',
      page: task.pageLabel,
      topic: task.topic,
      criterion: task.criterion,
      title: task.criterionTitle,
      level: task.level,
      tooling: task.tooling,
      reason: task.reason,
      methodology: task.methodology,
    })
    row.alignment = { vertical: 'top', wrapText: true }
    row.getCell('done').dataValidation = { type: 'list', allowBlank: true, formulae: ['"oui,non"'] }
  }

  styleHeader(sheet)
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: sheet.rowCount, column: 9 } }
}

/**
 * Le même reste à faire que la feuille précédente, rangé dans l'ordre où on le traite :
 * une ligne par critère, groupée par campagne d'outillage. Le protocole détaillé garde le
 * décompte page par page qu'exige la méthode officielle ; celle-ci sert à travailler.
 */
function renderManualCampaigns(workbook: ExcelJS.Workbook, model: TWorkbookModel): void {
  const sheet = workbook.addWorksheet('Protocole groupé')
  sheet.columns = [
    { header: 'Fait', key: 'done', width: 6 },
    { header: 'Campagne (outil)', key: 'tooling', width: 34 },
    { header: 'Thématique', key: 'topic', width: 22 },
    { header: 'N°', key: 'criterion', width: 8 },
    { header: 'Critère', key: 'title', width: 62 },
    { header: 'Niveau', key: 'level', width: 8 },
    { header: 'Pages', key: 'pageCount', width: 7 },
    { header: 'Pages concernées', key: 'pages', width: 44 },
    { header: "Pourquoi ce critère n'a pas pu être statué automatiquement", key: 'reason', width: 70 },
    { header: 'Méthodologie officielle RGAA', key: 'methodology', width: 100 },
  ]

  for (const campaign of model.manualCampaigns) {
    // Un motif unique se lit tel quel ; plusieurs motifs sont attribués à leurs pages.
    const reason =
      campaign.reasons.length === 1
        ? campaign.reasons[0].reason
        : campaign.reasons.map((entry) => `[${entry.pages.join(', ')}] ${entry.reason}`).join('\n\n')

    const row = sheet.addRow({
      done: '',
      tooling: campaign.tooling,
      topic: campaign.topic,
      criterion: campaign.criterion,
      title: campaign.criterionTitle,
      level: campaign.level,
      pageCount: campaign.pages.length,
      pages: campaign.pages.join(', '),
      reason,
      methodology: campaign.methodology,
    })
    row.alignment = { vertical: 'top', wrapText: true }
    row.getCell('done').dataValidation = { type: 'list', allowBlank: true, formulae: ['"oui,non"'] }
  }

  styleHeader(sheet)
  const columnCount = 10
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(sheet.rowCount, 1), column: columnCount } }

  sheet.insertRow(1, [
    `${model.manualCampaigns.length} critères à éprouver pour couvrir les ${model.manualTasks.length} contrôles de la feuille ` +
      '« Protocole manuel » — un critère se teste une fois, puis se coche sur les pages concernées. ' +
      'Filtrez par campagne pour enchaîner les tests qui partagent le même outil.',
  ])
  const banner = sheet.getRow(1)
  banner.font = { italic: true }
  banner.alignment = { vertical: 'middle' }
  sheet.mergeCells(1, 1, 1, columnCount)
  sheet.views = [{ state: 'frozen', ySplit: 2 }]
}

/**
 * Feuilles du cahier de relevés. Elles ne portent aucun statut : une ligne = un élément à
 * juger, une colonne de réponse et une colonne de note. C'est ce qui transforme « inspecter
 * sept pages » en « parcourir une liste ».
 */
function renderReviewSheet(workbook: ExcelJS.Workbook, family: TReviewFamily): void {
  const sheet = workbook.addWorksheet(family.sheetName)

  sheet.columns = [
    { header: 'Réponse', key: 'answer', width: 12 },
    { header: 'Page', key: 'page', width: 28 },
    { header: 'Écran', key: 'scope', width: 20 },
    ...family.columns.map((column) => ({ header: column, key: column, width: Math.min(Math.max(column.length + 8, 18), 70) })),
    { header: 'Note', key: 'note', width: 40 },
  ]

  for (const row of family.rows) {
    const added = sheet.addRow(['', row.page, row.scope, ...row.values, ''])
    added.alignment = { vertical: 'top', wrapText: true }
    added.getCell(1).dataValidation = { type: 'list', allowBlank: true, formulae: ['"O,N,NA"'] }
  }

  styleHeader(sheet)
  const columnCount = family.columns.length + 4
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: Math.max(sheet.rowCount, 1), column: columnCount } }

  // Rappel du sens du relevé, en tête de feuille : ce n'est pas un verdict.
  const truncationNotice = family.truncated > 0 ? ` — ⚠ ${family.truncated} ligne(s) au-delà du plafond ne sont pas listées` : ''
  sheet.insertRow(1, [`${family.title} — ${family.question} — sert les critères ${family.criteria.join(', ')}${truncationNotice}`])
  const banner = sheet.getRow(1)
  banner.font = { italic: true }
  banner.alignment = { vertical: 'middle' }
  sheet.mergeCells(1, 1, 1, columnCount)
  sheet.views = [{ state: 'frozen', ySplit: 2 }]
}

export async function renderWorkbook(model: TWorkbookModel, criteria: TCriterion[], filePath: string): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'mle cli — audit-rgaa'
  workbook.created = new Date(model.generatedAt)

  renderSummary(workbook, model, criteria)
  renderSample(workbook, model)
  for (const auditSheet of model.sheets) renderCriteriaSheet(workbook, auditSheet, criteria)
  renderManualProtocol(workbook, model)
  renderManualCampaigns(workbook, model)
  for (const family of model.review) renderReviewSheet(workbook, family)

  await workbook.xlsx.writeFile(filePath)
}
