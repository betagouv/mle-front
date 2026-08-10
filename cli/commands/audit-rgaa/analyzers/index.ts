import type { TCollectedPage } from '../collect'
import { loadDocument } from '../dom'
import type { TAnalyzer, TAutoResult, TScopeVerdict } from './contract'
import { form111, form115, form116, form118, form1110, form1113 } from './forms'
import { frame21, frame22 } from './frames'
import { image11, image12 } from './images'
import { consultation132, link61, link62 } from './links'
import { mandatory81, mandatory83, mandatory84, mandatory85, mandatory88, mandatory89, mandatory810 } from './mandatory'
import { consultation131, consultation133, navigation126, navigation127, navigation128, presentation101 } from './navigation'
import { NOT_APPLICABLE_ANALYZERS } from './not-applicable'
import { AUTO_REMEDIATIONS } from './remediations'
import { structure91, structure92, structure93 } from './structure'
import { table54, table56, table57, table58 } from './tables'

/**
 * Registre des analyseurs. Seuls ceux marqués `coversAllTests` peuvent écrire « Conforme » :
 * les autres condamnent ou constatent, mais laissent le critère « À vérifier manuellement ».
 */
export const ANALYZERS: TAnalyzer[] = [
  image11,
  image12,
  frame21,
  frame22,
  table54,
  table56,
  table57,
  table58,
  link61,
  link62,
  mandatory81,
  mandatory83,
  mandatory84,
  mandatory85,
  mandatory88,
  mandatory89,
  mandatory810,
  structure91,
  structure92,
  structure93,
  presentation101,
  form111,
  form115,
  form116,
  form118,
  form1110,
  form1113,
  navigation126,
  navigation127,
  navigation128,
  consultation131,
  consultation132,
  consultation133,
  ...NOT_APPLICABLE_ANALYZERS,
]

function prefix(scope: string, detail: string, multiScope: boolean): string {
  return multiScope ? `[${scope}] ${detail}` : detail
}

/**
 * Agrège les verdicts d'un analyseur sur tous les écrans d'une feuille, puis applique
 * les deux règles qui garantissent l'honnêteté de la colonne Statut :
 *   - un analyseur partiel ne peut pas conclure « Conforme » ;
 *   - un angle mort (widget rendu côté client) interdit de conclure « Conforme » ou
 *     « Non applicable », mais n'efface pas une non-conformité réellement observée.
 */
export function runAnalyzers(collected: TCollectedPage[], blindSpots: Map<string, string[]>): TAutoResult[] {
  const documents = collected.map((page) => ({ scope: page.scope, document: loadDocument(page.html) }))
  const multiScope = documents.length > 1
  const results: TAutoResult[] = []

  for (const analyzer of ANALYZERS) {
    const verdicts: { scope: string; verdict: TScopeVerdict }[] = []
    for (const { scope, document } of documents) {
      try {
        verdicts.push({ scope, verdict: analyzer.analyze(document, scope) })
      } catch (error) {
        verdicts.push({ scope, verdict: { status: 'NA', detail: `Analyse interrompue : ${(error as Error).message}` } })
      }
    }

    const failures = verdicts.filter(({ verdict }) => verdict.status === 'NC')
    const blindSpotLabels = blindSpots.get(analyzer.criterion)

    // Un écran qui n'a pas tout couvert suffit à retirer la couverture intégrale à la feuille :
    // conclure « Conforme » sur la foi des seuls écrans mesurables serait un faux.
    const coversAllTests = verdicts.every(({ verdict }) => verdict.coversAllTests ?? analyzer.coversAllTests)

    if (failures.length > 0) {
      const remediation = AUTO_REMEDIATIONS[analyzer.criterion]
      if (!remediation) {
        throw new Error(`Analyseur ${analyzer.criterion} : aucune résolution déclarée dans AUTO_REMEDIATIONS`)
      }
      results.push({
        criterion: analyzer.criterion,
        status: 'NC',
        observation: failures.map(({ scope, verdict }) => prefix(scope, verdict.detail, multiScope)).join('\n'),
        fullyCovered: coversAllTests,
        priority: remediation.priority,
        remediation: remediation.remediation,
      })
      continue
    }

    const observation = verdicts.map(({ scope, verdict }) => prefix(scope, verdict.detail, multiScope)).join('\n')

    if (blindSpotLabels) {
      results.push({
        criterion: analyzer.criterion,
        status: 'NT',
        observation: `${observation}\nNon concluable automatiquement : ${blindSpotLabels.join(' ; ')}.`,
        fullyCovered: false,
      })
      continue
    }

    const everyNotApplicable = verdicts.every(({ verdict }) => verdict.status === 'NA')
    if (everyNotApplicable) {
      results.push({ criterion: analyzer.criterion, status: 'NA', observation, fullyCovered: coversAllTests })
      continue
    }

    results.push({
      criterion: analyzer.criterion,
      status: coversAllTests ? 'C' : 'NT',
      observation,
      fullyCovered: coversAllTests,
    })
  }

  return results
}

export type { TAnalyzer, TAutoResult } from './contract'
