import * as fs from 'node:fs'
import * as path from 'node:path'
import type { TCriterion } from '../referential'
import { STATUS_LABELS, type TWorkbookModel } from '../types'

/** BOM UTF-8 : sans lui, Excel massacre les accents à l'ouverture d'un CSV. */
const BOM = '﻿'

function quote(value: string | number): string {
  const text = String(value).replace(/"/g, '""')
  return `"${text}"`
}

/** Export CSV de secours : une feuille par fichier, indépendant du rendu Excel. */
export function writeCsvSheets(model: TWorkbookModel, criteria: TCriterion[], dir: string): string[] {
  fs.mkdirSync(dir, { recursive: true })
  const criterionByNumber = new Map(criteria.map((criterion) => [criterion.number, criterion]))
  const written: string[] = []

  for (const sheet of model.sheets) {
    const lines = [['Thématique', 'N°', 'Critère', 'Niveau', 'Statut', 'Origine', 'Constat', 'Résolution', 'Priorité'].map(quote).join(';')]

    for (const cell of sheet.cells) {
      const criterion = criterionByNumber.get(cell.criterion)
      if (!criterion) continue
      lines.push(
        [
          `${criterion.topicNumber}. ${criterion.topic}`,
          cell.criterion,
          criterion.title,
          criterion.level,
          STATUS_LABELS[cell.status],
          cell.origin,
          cell.observations.join(' | '),
          cell.remediations.join(' | '),
          cell.priority ?? '',
        ]
          .map(quote)
          .join(';'),
      )
    }

    const fileName = `${sheet.pageId}.csv`
    const filePath = path.join(dir, fileName)
    fs.writeFileSync(filePath, BOM + lines.join('\n'), 'utf-8')
    written.push(filePath)
  }

  return written
}
