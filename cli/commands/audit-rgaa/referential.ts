import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { z } from 'zod'
import { type TRgaaLevel, ZRgaaLevel } from './types'

const RGAA_VERSION = '4.1'

const SOURCES = {
  criteres: 'https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA/4.1/criteres.json',
  methodologies: 'https://raw.githubusercontent.com/DISIC/accessibilite.numerique.gouv.fr/main/RGAA/4.1/methodologies.json',
  niveaux: 'https://accessibilite.numerique.gouv.fr/methode/criteres-et-tests/',
} as const

export const CRITERIA_FILE = 'rgaa-4.1-criteres.json'
export const LEVELS_FILE = 'rgaa-4.1-niveaux.json'
export const METHODOLOGIES_FILE = 'rgaa-4.1-methodologies.json'

/** Nombre de critères du RGAA 4.1. Toute dérive est une erreur, pas une surprise. */
export const CRITERIA_COUNT = 106

const ZCriterion = z.object({
  number: z.string(),
  topicNumber: z.number(),
  topic: z.string(),
  title: z.string(),
  tests: z.record(z.string(), z.string()),
})
export type TCriterion = z.infer<typeof ZCriterion> & { level: TRgaaLevel; wcag: string[] }

const ZCriteriaFile = z.object({
  version: z.literal(RGAA_VERSION),
  source: z.string(),
  criteria: z.array(ZCriterion),
})

const ZLevelsFile = z.object({
  version: z.literal(RGAA_VERSION),
  source: z.string(),
  levels: z.record(z.string(), z.object({ level: ZRgaaLevel, wcag: z.array(z.string()) })),
})

const ZMethodologiesFile = z.record(z.string(), z.string())

/** Transforme le markdown du référentiel (liens, code, emphases) en texte brut lisible en cellule Excel. */
export function stripMarkdown(input: string): string {
  return input
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Tri numérique : sans lui, « 10.1 » passerait avant « 2.1 ». */
export function compareCriteria(a: string, b: string): number {
  const [aTopic, aIndex] = a.split('.').map(Number)
  const [bTopic, bIndex] = b.split('.').map(Number)
  return aTopic - bTopic || aIndex - bIndex
}

async function download(url: string): Promise<string> {
  const response = await fetch(url, { headers: { 'User-Agent': 'mle-audit-rgaa/1.0' } })
  if (!response.ok) throw new Error(`Téléchargement du référentiel échoué : ${url} → HTTP ${response.status}`)
  return response.text()
}

/**
 * Le niveau WCAG (A/AA) n'est présent dans aucun JSON publié par la DINUM.
 * Il est reconstruit depuis la page « Critères et tests », qui affiche pour chaque
 * critère ses critères de succès WCAG sous la forme « 1.1.1 (A) ».
 * Règle : niveau A si au moins un critère de succès est de niveau A, sinon AA.
 */
function extractLevels(html: string): Record<string, { level: TRgaaLevel; wcag: string[] }> {
  const blocks = html.split(/<h3[^>]*>/).slice(1)
  const levels: Record<string, { level: TRgaaLevel; wcag: string[] }> = {}

  for (const block of blocks) {
    const number = block.match(/<span class="number">([\d.]+)<\/span>/)?.[1]
    if (!number) continue

    // Les références WCAG apparaissent dans la section « Critère(s) de succès » des annexes.
    const successCriteria = block.split('Critère(s) de succès')[1]?.split('Technique(s)')[0] ?? ''
    const wcag = [...successCriteria.matchAll(/>(\d+\.\d+\.\d+ \((A{1,3})\))</g)].map((match) => match[1])
    if (wcag.length === 0) continue

    const hasLevelA = wcag.some((reference) => reference.endsWith('(A)'))
    levels[number] = { level: hasLevelA ? 'A' : 'AA', wcag: [...new Set(wcag)] }
  }

  return levels
}

function normalizeCriteria(raw: unknown): z.infer<typeof ZCriteriaFile>['criteria'] {
  const ZRaw = z.object({
    topics: z.array(
      z.object({
        topic: z.string(),
        number: z.number(),
        criteria: z.array(
          z.object({
            criterium: z.object({
              number: z.number(),
              title: z.string(),
              tests: z.record(z.string(), z.array(z.string())),
            }),
          }),
        ),
      }),
    ),
  })

  const parsed = ZRaw.safeParse(raw)
  if (!parsed.success) throw new Error(`Format inattendu de criteres.json : ${parsed.error.message}`)

  return parsed.data.topics.flatMap((topic) =>
    topic.criteria.map(({ criterium }) => ({
      number: `${topic.number}.${criterium.number}`,
      topicNumber: topic.number,
      topic: stripMarkdown(topic.topic),
      title: stripMarkdown(criterium.title),
      tests: Object.fromEntries(
        Object.entries(criterium.tests).map(([testIndex, lines]) => [
          `${topic.number}.${criterium.number}.${testIndex}`,
          stripMarkdown(lines.join(' ')),
        ]),
      ),
    })),
  )
}

/** Re-télécharge le référentiel depuis les sources DINUM et le fige dans le dépôt. */
export async function refreshReferential(dir: string): Promise<void> {
  fs.mkdirSync(dir, { recursive: true })

  const [criteresRaw, methodologiesRaw, levelsHtml] = await Promise.all([
    download(SOURCES.criteres),
    download(SOURCES.methodologies),
    download(SOURCES.niveaux),
  ])

  const criteria = normalizeCriteria(JSON.parse(criteresRaw))
  if (criteria.length !== CRITERIA_COUNT) {
    throw new Error(`Référentiel incohérent : ${criteria.length} critères téléchargés, ${CRITERIA_COUNT} attendus`)
  }

  const levels = extractLevels(levelsHtml)
  const missing = criteria.filter((criterion) => !levels[criterion.number]).map((criterion) => criterion.number)
  if (missing.length > 0) {
    throw new Error(`Niveau WCAG introuvable pour ${missing.length} critère(s) : ${missing.join(', ')}`)
  }

  const methodologies = ZMethodologiesFile.parse(JSON.parse(methodologiesRaw))

  writeJson(path.join(dir, CRITERIA_FILE), { version: RGAA_VERSION, source: SOURCES.criteres, criteria })
  writeJson(path.join(dir, LEVELS_FILE), { version: RGAA_VERSION, source: SOURCES.niveaux, levels })
  writeJson(path.join(dir, METHODOLOGIES_FILE), methodologies)

  const levelCounts = Object.values(levels).reduce<Record<string, number>>((acc, { level }) => {
    acc[level] = (acc[level] ?? 0) + 1
    return acc
  }, {})
  console.log(`  Référentiel RGAA ${RGAA_VERSION} figé : ${criteria.length} critères (${levelCounts.A ?? 0} A, ${levelCounts.AA ?? 0} AA)`)
}

function writeJson(filePath: string, data: unknown): void {
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf-8')
}

export type TReferential = {
  criteria: TCriterion[]
  methodologies: Record<string, string>
  sha256: string
}

/** Charge le référentiel figé. Échoue bruyamment plutôt que de produire un classeur incomplet. */
export function loadReferential(dir: string): TReferential {
  const criteriaPath = path.join(dir, CRITERIA_FILE)
  if (!fs.existsSync(criteriaPath)) {
    throw new Error(`Référentiel absent (${criteriaPath}). Lancez la commande avec --refresh-referentiel.`)
  }

  const rawCriteria = fs.readFileSync(criteriaPath, 'utf-8')
  const criteriaFile = ZCriteriaFile.parse(JSON.parse(rawCriteria))
  const levelsFile = ZLevelsFile.parse(JSON.parse(fs.readFileSync(path.join(dir, LEVELS_FILE), 'utf-8')))
  const methodologies = ZMethodologiesFile.parse(JSON.parse(fs.readFileSync(path.join(dir, METHODOLOGIES_FILE), 'utf-8')))

  const criteria: TCriterion[] = criteriaFile.criteria
    .map((criterion) => {
      const level = levelsFile.levels[criterion.number]
      if (!level) throw new Error(`Niveau WCAG manquant pour le critère ${criterion.number}`)
      return { ...criterion, level: level.level, wcag: level.wcag }
    })
    .sort((a, b) => compareCriteria(a.number, b.number))

  if (criteria.length !== CRITERIA_COUNT) {
    throw new Error(`Référentiel incohérent : ${criteria.length} critères chargés, ${CRITERIA_COUNT} attendus`)
  }

  return { criteria, methodologies, sha256: createHash('sha256').update(rawCriteria).digest('hex') }
}
