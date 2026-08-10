import * as XLSX from 'xlsx'
import type { TCriterion } from './referential'
import { CRITERIA_COUNT, compareCriteria } from './referential'
import { RGAA_ORIGINS, RGAA_PRIORITIES, RGAA_STATUSES, STATUS_LABELS, type TWorkbookModel } from './types'

const FORBIDDEN_SHEET_CHARS = /[:\\/?*[\]]/

/**
 * Assertions d'intégrité du modèle. Elles s'exécutent à chaque run : un classeur
 * incohérent doit faire échouer la commande, jamais être livré tel quel.
 */
export function verifyModel(model: TWorkbookModel, criteria: TCriterion[]): string[] {
  const errors: string[] = []
  const expectedCriteria = criteria.map((criterion) => criterion.number)

  // 1 — nommage des feuilles
  const names = model.sheets.map((sheet) => sheet.sheetName)
  for (const name of names) {
    if (name.length > 31) errors.push(`Nom de feuille trop long (${name.length} > 31) : « ${name} »`)
    if (FORBIDDEN_SHEET_CHARS.test(name)) errors.push(`Nom de feuille contenant un caractère interdit : « ${name} »`)
  }
  if (new Set(names).size !== names.length) errors.push('Deux feuilles portent le même nom')

  for (const sheet of model.sheets) {
    const label = `Feuille « ${sheet.sheetName} »`

    // 2 — exhaustivité et ordre des critères
    if (sheet.cells.length !== CRITERIA_COUNT) errors.push(`${label} : ${sheet.cells.length} lignes au lieu de ${CRITERIA_COUNT}`)

    const numbers = sheet.cells.map((cell) => cell.criterion)
    if (new Set(numbers).size !== numbers.length) errors.push(`${label} : critère(s) en double`)

    const missing = expectedCriteria.filter((number) => !numbers.includes(number))
    if (missing.length > 0) errors.push(`${label} : critère(s) manquant(s) — ${missing.join(', ')}`)

    for (let index = 1; index < numbers.length; index++) {
      if (compareCriteria(numbers[index - 1], numbers[index]) >= 0) {
        errors.push(`${label} : ordre des critères incorrect (${numbers[index - 1]} avant ${numbers[index]})`)
        break
      }
    }

    const counts = { C: 0, NC: 0, NA: 0, NT: 0 }

    for (const cell of sheet.cells) {
      const cellLabel = `${label}, critère ${cell.criterion}`

      // 3 — énumérations et priorité
      if (!RGAA_STATUSES.includes(cell.status)) errors.push(`${cellLabel} : statut invalide « ${cell.status} »`)
      if (!RGAA_ORIGINS.includes(cell.origin)) errors.push(`${cellLabel} : origine invalide « ${cell.origin} »`)
      if (cell.status === 'NC' && !cell.priority) errors.push(`${cellLabel} : priorité manquante sur un constat non conforme`)
      if (cell.status !== 'NC' && cell.priority) errors.push(`${cellLabel} : priorité renseignée hors constat non conforme`)
      if (cell.priority && !RGAA_PRIORITIES.includes(cell.priority)) errors.push(`${cellLabel} : priorité invalide`)

      // 4 — constat et résolution obligatoires
      const observation = cell.observations.filter((text) => text.trim()).join('')
      if (!observation) errors.push(`${cellLabel} : constat vide`)
      if (cell.status === 'NC' && cell.remediations.length === 0) errors.push(`${cellLabel} : non conforme sans résolution`)
      if (cell.status === 'NA' && !observation) errors.push(`${cellLabel} : non applicable sans justification`)

      // 9 — la promesse d'honnêteté : « Conforme » automatique implique couverture intégrale
      if (cell.status === 'C' && cell.origin === 'automatique' && !cell.fullyCovered) {
        errors.push(`${cellLabel} : conforme d'origine automatique alors que l'analyseur ne couvre pas tous les tests du critère`)
      }

      counts[cell.status]++
    }

    // 5 — somme des statuts
    const total = counts.C + counts.NC + counts.NA + counts.NT
    if (total !== CRITERIA_COUNT) errors.push(`${label} : somme des statuts ${total} au lieu de ${CRITERIA_COUNT}`)
  }

  // 6 — correspondance avec le protocole manuel
  const untestedTotal = model.sheets.reduce((sum, sheet) => sum + sheet.cells.filter((cell) => cell.status === 'NT').length, 0)
  if (untestedTotal !== model.manualTasks.length) {
    errors.push(`Protocole manuel : ${model.manualTasks.length} lignes pour ${untestedTotal} critères à vérifier manuellement`)
  }

  // 10 — le regroupement par campagne couvre exactement le protocole manuel
  const groupedTotal = model.manualCampaigns.reduce((sum, campaign) => sum + campaign.pages.length, 0)
  if (groupedTotal !== model.manualTasks.length) {
    errors.push(`Protocole groupé : ${groupedTotal} contrôles regroupés pour ${model.manualTasks.length} lignes de protocole`)
  }
  const groupedCriteria = model.manualCampaigns.map((campaign) => campaign.criterion)
  if (new Set(groupedCriteria).size !== groupedCriteria.length) {
    errors.push('Protocole groupé : un même critère apparaît dans plusieurs campagnes')
  }
  const taskCriteria = new Set(model.manualTasks.map((task) => task.criterion))
  const missing = [...taskCriteria].filter((criterion) => !groupedCriteria.includes(criterion))
  if (missing.length > 0) {
    errors.push(`Protocole groupé : critère(s) absent(s) du regroupement — ${missing.join(', ')}`)
  }

  // 7 — recalcul des taux
  for (const rate of model.rates) {
    const sheet = model.sheets.find((item) => item.pageId === rate.pageId)
    if (!sheet) {
      errors.push(`Taux calculé pour une page absente du classeur : ${rate.pageId}`)
      continue
    }
    const conforming = sheet.cells.filter((cell) => cell.status === 'C').length
    const failing = sheet.cells.filter((cell) => cell.status === 'NC').length
    const expected = conforming + failing > 0 ? conforming / (conforming + failing) : null
    if (expected !== null && rate.provisional !== null && Math.abs(expected - rate.provisional) > 0.0005) {
      errors.push(`Taux provisoire incohérent pour ${rate.pageId} : ${rate.provisional} attendu ${expected}`)
    }
  }

  // 8 — table des niveaux
  const levelCounts = criteria.reduce<Record<string, number>>((acc, criterion) => {
    acc[criterion.level] = (acc[criterion.level] ?? 0) + 1
    return acc
  }, {})
  if (criteria.length !== CRITERIA_COUNT) errors.push(`Référentiel : ${criteria.length} critères au lieu de ${CRITERIA_COUNT}`)
  if (levelCounts.A !== 83 || levelCounts.AA !== 23) {
    errors.push(`Répartition des niveaux inattendue : ${levelCounts.A ?? 0} A / ${levelCounts.AA ?? 0} AA (attendu 83 / 23)`)
  }

  return errors
}

const VALID_STATUS_LABELS = new Set(Object.values(STATUS_LABELS))

/**
 * Contrôle du fichier réellement livré : le classeur est écrit par exceljs puis relu
 * par SheetJS. Deux bibliothèques indépendantes se contrôlent mutuellement — on prouve
 * ainsi la correction du .xlsx sur disque, pas seulement celle de l'objet en mémoire.
 */
export function verifyWorkbookFile(filePath: string, expectedSheetNames: string[], criteria: TCriterion[]): string[] {
  const errors: string[] = []
  const workbook = XLSX.readFile(filePath)

  for (const name of expectedSheetNames) {
    if (!workbook.SheetNames.includes(name)) {
      errors.push(`Feuille absente du fichier produit : « ${name} »`)
      continue
    }

    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(workbook.Sheets[name], { defval: '' })
    if (rows.length !== CRITERIA_COUNT) {
      errors.push(`Fichier produit, feuille « ${name} » : ${rows.length} lignes de données au lieu de ${CRITERIA_COUNT}`)
      continue
    }

    const numbers = rows.map((row) => String(row['N°']))
    const expected = criteria.map((criterion) => criterion.number)
    if (numbers.join('|') !== expected.join('|')) {
      errors.push(`Fichier produit, feuille « ${name} » : la liste ou l'ordre des critères ne correspond pas au référentiel`)
    }

    const emptyStatus = rows.filter((row) => !VALID_STATUS_LABELS.has(String(row.Statut))).length
    if (emptyStatus > 0) errors.push(`Fichier produit, feuille « ${name} » : ${emptyStatus} statut(s) vide(s) ou hors énumération`)

    const emptyObservation = rows.filter((row) => !String(row.Constat).trim()).length
    if (emptyObservation > 0) errors.push(`Fichier produit, feuille « ${name} » : ${emptyObservation} constat(s) vide(s)`)
  }

  return errors
}
