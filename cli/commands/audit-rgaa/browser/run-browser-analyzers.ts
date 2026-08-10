import type { TAutoResult, TScopeVerdict } from '../analyzers/contract'
import { AUTO_REMEDIATIONS } from '../analyzers/remediations'
import { AXE_TO_RGAA, BROWSER_ANALYZERS } from './analyzers-browser'
import type { TBrowserSnapshot } from './collect-browser'

function prefix(scope: string, detail: string, multiScope: boolean): string {
  return multiScope ? `[${scope}] ${detail}` : detail
}

/**
 * Constats axe-core, regroupés par critère RGAA.
 *
 * axe **n'écrit jamais un statut** : ses règles ne recouvrent pas les tests du RGAA un pour un,
 * et sa portée est plus étroite. Ses violations sont versées au constat du critère concerné,
 * comme un second regard qui pointe où chercher.
 */
export function axeObservationsByCriterion(snapshots: TBrowserSnapshot[]): Map<string, string> {
  const byCriterion = new Map<string, string[]>()
  const multiScope = snapshots.length > 1

  for (const snapshot of snapshots) {
    for (const violation of snapshot.axe) {
      const criterion = AXE_TO_RGAA[violation.id]
      if (!criterion) continue
      const targets = violation.nodes.map((node) => node.target).join(' ; ')
      const line = prefix(snapshot.scope, `axe « ${violation.id} » (${violation.impact}) : ${violation.help} → ${targets}`, multiScope)
      byCriterion.set(criterion, [...(byCriterion.get(criterion) ?? []), line])
    }
  }

  return new Map([...byCriterion.entries()].map(([criterion, lines]) => [criterion, lines.join('\n')]))
}

/** Violations axe sans correspondance RGAA déclarée : conservées pour la synthèse. */
export function unmappedAxeViolations(snapshots: TBrowserSnapshot[]): string[] {
  const seen = new Map<string, number>()
  for (const snapshot of snapshots) {
    for (const violation of snapshot.axe) {
      if (AXE_TO_RGAA[violation.id]) continue
      seen.set(violation.id, (seen.get(violation.id) ?? 0) + violation.nodes.length)
    }
  }
  return [...seen.entries()].map(([id, count]) => `${id} (${count} occurrence(s))`)
}

/**
 * Applique les analyseurs de rendu à tous les écrans d'une feuille.
 * Mêmes règles d'agrégation que la passe DOM : une condamnation sur un écran condamne la
 * feuille, un angle mort interdit de conclure, et seul un analyseur intégral peut absoudre.
 */
export function runBrowserAnalyzers(snapshots: TBrowserSnapshot[], blindSpots: Map<string, string[]>): TAutoResult[] {
  if (snapshots.length === 0) return []

  const multiScope = snapshots.length > 1
  const results: TAutoResult[] = []

  for (const analyzer of BROWSER_ANALYZERS) {
    const verdicts: { scope: string; verdict: TScopeVerdict }[] = []
    for (const snapshot of snapshots) {
      try {
        verdicts.push({ scope: snapshot.scope, verdict: analyzer.analyze(snapshot) })
      } catch (error) {
        verdicts.push({ scope: snapshot.scope, verdict: { status: 'NA', detail: `Analyse interrompue : ${(error as Error).message}` } })
      }
    }

    const failures = verdicts.filter(({ verdict }) => verdict.status === 'NC')
    // Même règle que la passe DOM : la couverture d'une feuille est celle de son écran le moins couvert.
    const coversAllTests = verdicts.every(({ verdict }) => verdict.coversAllTests ?? analyzer.coversAllTests)

    if (failures.length > 0) {
      const remediation = AUTO_REMEDIATIONS[analyzer.criterion]
      if (!remediation) {
        throw new Error(`Analyseur navigateur ${analyzer.criterion} : aucune résolution déclarée dans AUTO_REMEDIATIONS`)
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
    const blindSpotLabels = blindSpots.get(analyzer.criterion)

    if (blindSpotLabels) {
      results.push({
        criterion: analyzer.criterion,
        status: 'NT',
        observation: `${observation}\nNon concluable automatiquement : ${blindSpotLabels.join(' ; ')}.`,
        fullyCovered: false,
      })
      continue
    }

    if (verdicts.every(({ verdict }) => verdict.status === 'NA')) {
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

/**
 * Fusionne les résultats des deux passes automatiques.
 *
 * Les deux sources peuvent statuer le même critère : le HTML serveur voit ce qui doit être vrai
 * sans JavaScript, le rendu voit ce que l'utilisateur a réellement sous les yeux. La règle est
 * celle du reste du dispositif — le plus sévère l'emporte — et les deux constats sont conservés.
 */
const STATUS_RANK: Record<string, number> = { NC: 3, NT: 2, NA: 1, C: 0 }

export function mergeAutoResults(
  domResults: TAutoResult[],
  browserResults: TAutoResult[],
  axeByCriterion: Map<string, string>,
): TAutoResult[] {
  const byCriterion = new Map<string, TAutoResult>()

  for (const result of domResults) byCriterion.set(result.criterion, { ...result })

  for (const result of browserResults) {
    const existing = byCriterion.get(result.criterion)
    if (!existing) {
      byCriterion.set(result.criterion, { ...result, observation: `Analyse du rendu — ${result.observation}` })
      continue
    }

    const browserWins = STATUS_RANK[result.status] > STATUS_RANK[existing.status]
    byCriterion.set(result.criterion, {
      criterion: result.criterion,
      status: browserWins ? result.status : existing.status,
      observation: `${existing.observation}\nAnalyse du rendu — ${result.observation}`,
      fullyCovered: browserWins ? result.fullyCovered : existing.fullyCovered,
      priority: browserWins ? result.priority : existing.priority,
      remediation: browserWins ? result.remediation : existing.remediation,
    })
  }

  for (const [criterion, observation] of axeByCriterion) {
    const existing = byCriterion.get(criterion)
    if (existing) {
      byCriterion.set(criterion, { ...existing, observation: `${existing.observation}\n${observation}` })
      continue
    }

    // Un critère sans analyseur reste « à vérifier manuellement » — axe ne statue jamais. Mais
    // jeter sa violation priverait l'auditeur d'une piste concrète : sans cette branche, les huit
    // règles ARIA rattachées au critère 7.1 et « duplicate-id-aria » rattachée au 8.2 étaient
    // collectées à chaque page puis perdues, ces deux critères n'ayant aucun analyseur.
    byCriterion.set(criterion, {
      criterion,
      status: 'NT',
      observation: `Aucun analyseur pour ce critère ; axe-core signale toutefois :\n${observation}`,
      fullyCovered: false,
    })
  }

  return [...byCriterion.values()]
}
