import { execSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { closeDb } from '~/server/db'
import { runAnalyzers } from './analyzers'
import { collectPageWithBrowser, launchBrowser, type TBrowserSnapshot } from './browser/collect-browser'
import { axeObservationsByCriterion, mergeAutoResults, runBrowserAnalyzers, unmappedAxeViolations } from './browser/run-browser-analyzers'
import { collectPage, type TCollectedPage } from './collect'
import { LEGAL_ISSUES, loadExpertFindings } from './data/findings'
import { mergeSheet } from './merge'
import { blindSpotsFor, buildAuditPages } from './pages'
import { CRITERIA_COUNT, loadReferential, refreshReferential } from './referential'
import { writeCsvSheets } from './render/csv'
import { renderWorkbook } from './render/xlsx'
import { buildReviewSheets, type TReviewSource } from './review/extract'
import { selectAccommodationCandidates } from './sample'
import { buildManualCampaigns, buildManualProtocol, computeRates } from './summary'
import type { TAuditSample, TAuditSheet, TWorkbookModel } from './types'
import { verifyModel, verifyWorkbookFile } from './verify'

export type TAuditRgaaOptions = {
  out?: string
  baseUrl?: string
  cookie?: string
  accommodation?: string
  fromCache?: boolean
  csv?: boolean
  check?: boolean
  refreshReferentiel?: boolean
  /** Ajoute la passe navigateur : rendu réel, contrastes calculés, focus, reflow, axe-core. */
  browser?: boolean
  verbose?: boolean
}

const REFERENTIAL_SUBDIR = 'referentiel'

function currentCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf-8' }).trim()
  } catch {
    return 'inconnu'
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

export async function auditRgaa(options: TAuditRgaaOptions): Promise<void> {
  const outDir = options.out ?? 'docs/audit-rgaa'
  const baseUrl = options.baseUrl ?? 'http://localhost:3000'
  const cookie = options.cookie ?? process.env.AUDIT_SESSION_COOKIE

  try {
    const referentialDir = path.join(outDir, REFERENTIAL_SUBDIR)
    if (options.refreshReferentiel) {
      console.log('⬇️  Téléchargement du référentiel RGAA 4.1 depuis la DINUM...')
      await refreshReferential(referentialDir)
    }

    const referential = loadReferential(referentialDir)
    const knownCriteria = new Set(referential.criteria.map((criterion) => criterion.number))
    const expertFindings = loadExpertFindings(knownCriteria)

    console.log(`\n🔍 Audit RGAA 4.1 — ${CRITERIA_COUNT} critères, base ${baseUrl}\n`)

    console.log("📌 Sélection de l'échantillon...")
    const candidates = await selectAccommodationCandidates(options.accommodation)
    const accommodation = candidates[0]
    if (options.verbose) {
      console.log('  Top 10 des fiches par richesse de contenu :')
      for (const candidate of candidates) {
        console.log(`    ${candidate.score.toFixed(1).padStart(6)} — ${candidate.slug} (${candidate.cityName})`)
      }
    }
    console.log(`  Fiche retenue : ${accommodation.name} — ${accommodation.url}`)
    console.log(
      `  (${accommodation.imagesCount} image(s), visite virtuelle : ${accommodation.hasVirtualTour ? 'oui' : 'non'}, ` +
        `${accommodation.equipmentsCount} équipement(s), ${accommodation.typologiesCount} typologie(s))`,
    )

    const pages = buildAuditPages(accommodation.url)
    const templateFindings = expertFindings.gabarit ?? []

    console.log('\n🌐 Collecte du HTML rendu...')
    const collectedByPage = new Map<string, TCollectedPage[]>()
    for (const page of pages) {
      collectedByPage.set(page.id, await collectPage(page, { baseUrl, cookie, fromCache: options.fromCache, verbose: options.verbose }))
    }

    // Passe navigateur : DOM hydraté, couleurs calculées, focus, tabulation, débordements.
    // Elle ne remplace pas la collecte HTTP, elle lui répond — le HTML serveur reste la
    // référence pour ce qui doit être vrai sans JavaScript.
    const snapshotsByPage = new Map<string, TBrowserSnapshot[]>()
    if (options.browser) {
      console.log('\n🖥️  Collecte navigateur (Playwright)...')
      const browser = await launchBrowser()
      try {
        for (const page of pages) {
          snapshotsByPage.set(
            page.id,
            await collectPageWithBrowser(browser, page, { baseUrl, cookie, fromCache: options.fromCache, verbose: options.verbose }),
          )
        }
      } finally {
        await browser.close()
      }
    }

    console.log('\n⚙️  Analyse automatique et fusion des constats...')
    const reviewSources: TReviewSource[] = []
    const sheets: TAuditSheet[] = []
    const sample: TAuditSample[] = []
    const warnings: string[] = []

    for (const page of pages) {
      const collected = collectedByPage.get(page.id) ?? []
      const snapshots = snapshotsByPage.get(page.id) ?? []
      const observedWidgets = [...new Set(snapshots.flatMap((snapshot) => snapshot.renderedWidgets))]
      const blindSpots = blindSpotsFor(page, options.browser ? observedWidgets : undefined)

      // Les analyseurs DOM tournent sur le rendu hydraté quand il existe : c'est là que
      // se trouvent la carte, le graphique et le contenu injecté après hydratation.
      const documents: TCollectedPage[] =
        snapshots.length > 0
          ? collected.map((item) => {
              const snapshot = snapshots.find((candidate) => candidate.scope === item.scope)
              return snapshot ? { ...item, html: snapshot.hydratedHtml } : item
            })
          : collected

      for (const item of documents) {
        reviewSources.push({ pageLabel: page.label, scope: item.scope, html: item.html })
      }
      // Le contenu des modales n'apparaît nulle part ailleurs dans le classeur.
      for (const snapshot of snapshots) {
        for (const modal of snapshot.modals) {
          if (modal.opened && modal.html) {
            reviewSources.push({
              pageLabel: page.label,
              scope: `${snapshot.scope} — modale « ${modal.triggerLabel || modal.modalId} »`,
              html: modal.html,
            })
          }
        }
      }

      const autoResults = mergeAutoResults(
        runAnalyzers(documents, blindSpots),
        runBrowserAnalyzers(snapshots, blindSpots),
        axeObservationsByCriterion(snapshots),
      )

      const { sheet, warnings: sheetWarnings } = mergeSheet({
        page,
        criteria: referential.criteria,
        autoResults,
        expertFindings: expertFindings[page.id] ?? [],
        templateFindings,
      })

      sheets.push(sheet)
      warnings.push(...sheetWarnings)

      // Les règles axe sans correspondance RGAA ne statuent rien mais valent d'être lues :
      // elles signalent des défauts réels hors de la grille, ou une lacune de la table.
      const unmapped = unmappedAxeViolations(snapshots)
      if (unmapped.length > 0) {
        warnings.push(`Page « ${page.id} » : violations axe hors table de correspondance RGAA — ${unmapped.join(', ')}`)
      }

      sample.push({
        pageId: page.id,
        label: page.label,
        auth: page.auth,
        blindSpots: [...new Set([...blindSpots.values()].flat())],
        urls: collected.map((item) => ({
          scope: item.scope,
          url: item.url,
          acceptLanguage: item.acceptLanguage,
          httpStatus: item.httpStatus,
          bytes: item.bytes,
        })),
      })
    }

    // Un plafond atteint doit être dit : une liste tronquée en silence se lirait comme exhaustive.
    const reviewFamilies = buildReviewSheets(reviewSources)
    for (const family of reviewFamilies) {
      if (family.truncated > 0) {
        warnings.push(`Cahier de relevés « ${family.sheetName} » : ${family.truncated} ligne(s) au-delà du plafond ne sont pas listées`)
      }
    }

    const manualTasks = buildManualProtocol(sheets, referential.criteria, referential.methodologies)

    const model: TWorkbookModel = {
      generatedAt: new Date().toISOString(),
      baseUrl,
      commit: currentCommit(),
      referentialSha256: referential.sha256,
      sample,
      sheets,
      rates: computeRates(sheets, CRITERIA_COUNT),
      manualTasks,
      manualCampaigns: buildManualCampaigns(manualTasks),
      legalIssues: LEGAL_ISSUES,
      review: reviewFamilies,
      warnings,
    }

    const modelErrors = verifyModel(model, referential.criteria)
    if (modelErrors.length > 0) {
      console.error('\n❌ Modèle incohérent :')
      for (const error of modelErrors) console.error(`  - ${error}`)
      process.exitCode = 1
      return
    }
    console.log('  ✅ Modèle vérifié (10 assertions)')

    printSummary(model)

    if (options.check) {
      console.log('\n🧪 Mode --check : aucun fichier écrit.')
      return
    }

    const runDir = path.join(outDir, today())
    fs.mkdirSync(runDir, { recursive: true })

    const workbookPath = path.join(runDir, `audit-rgaa-4.1-mle-${today()}.xlsx`)
    await renderWorkbook(model, referential.criteria, workbookPath)
    fs.writeFileSync(path.join(runDir, 'audit-rgaa.json'), `${JSON.stringify(model, null, 2)}\n`, 'utf-8')
    fs.writeFileSync(
      path.join(runDir, 'echantillon.json'),
      `${JSON.stringify({ accommodation, candidates, baseUrl, commit: model.commit, referentialSha256: model.referentialSha256 }, null, 2)}\n`,
      'utf-8',
    )

    if (options.csv) {
      const files = writeCsvSheets(model, referential.criteria, path.join(runDir, 'csv'))
      console.log(`\n📄 ${files.length} fichier(s) CSV écrits dans ${path.join(runDir, 'csv')}`)
    }

    const fileErrors = verifyWorkbookFile(
      workbookPath,
      sheets.map((sheet) => sheet.sheetName),
      referential.criteria,
    )
    if (fileErrors.length > 0) {
      console.error('\n❌ Le fichier produit ne passe pas la relecture :')
      for (const error of fileErrors) console.error(`  - ${error}`)
      process.exitCode = 1
      return
    }

    console.log(`  ✅ Fichier relu et vérifié (${sheets.length} feuilles de critères)`)
    console.log(`\n📊 Classeur : ${workbookPath}`)
  } finally {
    await closeDb()
  }
}

function printSummary(model: TWorkbookModel): void {
  console.log('\n📊 Résultats\n')
  console.log('  Page                                    C   NC   NA   AVM   provisoire  plancher  couverture')
  for (const rate of model.rates) {
    const provisional = rate.provisional === null ? '   n/a' : `${(rate.provisional * 100).toFixed(1).padStart(5)}%`
    console.log(
      `  ${rate.label.slice(0, 38).padEnd(38)} ${String(rate.counts.C).padStart(3)} ${String(rate.counts.NC).padStart(4)} ` +
        `${String(rate.counts.NA).padStart(4)} ${String(rate.counts.NT).padStart(5)}   ${provisional}    ` +
        `${(rate.floor * 100).toFixed(1).padStart(5)}%    ${(rate.coverage * 100).toFixed(1).padStart(5)}%`,
    )
  }

  console.log(`\n  ${model.manualTasks.length} contrôle(s) à réaliser manuellement (feuille « Protocole manuel »)`)
  console.log(
    `  soit ${model.manualCampaigns.length} critère(s) à éprouver, regroupés en ` +
      `${new Set(model.manualCampaigns.map((campaign) => campaign.tooling)).size} campagne(s) (feuille « Protocole groupé »)`,
  )
  console.log(`  ${model.legalIssues.length} non-conformité(s) légale(s) hors RGAA (décret 2019-768)`)

  if (model.warnings.length > 0) {
    console.log('\n⚠️  Avertissements :')
    for (const warning of model.warnings) console.log(`  - ${warning}`)
  }
}
