import { subMonths } from 'date-fns'
import { and, inArray, lt, type SQL } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { closeDb, db } from '~/server/db'
import { activityLog } from '~/server/db/schema/activity-log'
import { alertJobs } from '~/server/db/schema/alert-jobs'
import { importJobs } from '~/server/db/schema/import-jobs'
import { captureCliException } from '../sentry'

interface PurgeLogsOptions {
  dryRun?: boolean
  verbose?: boolean
  retentionMonths?: number
}

const DEFAULT_RETENTION_MONTHS = 6

interface PurgeTarget {
  label: string
  table: PgTable & { id: PgColumn }
  /** Condition des lignes à supprimer (plus vieilles que le seuil de rétention). */
  where: (cutoff: Date) => SQL
  /** Détail affiché en --verbose pour expliquer le filtre. */
  detail?: string
}

const TARGETS: PurgeTarget[] = [
  {
    label: 'activity_log',
    table: activityLog,
    where: (cutoff) => lt(activityLog.createdAt, cutoff),
  },
  {
    label: 'alert_job',
    table: alertJobs,
    // On ne purge que les jobs terminés : un job `pending` reste actionnable par le sender.
    where: (cutoff) => and(lt(alertJobs.createdAt, cutoff), inArray(alertJobs.status, ['sent', 'failed'])) as SQL,
    detail: "statuts 'sent' et 'failed' uniquement (les 'pending' sont conservés)",
  },
  {
    label: 'import_jobs',
    table: importJobs,
    where: (cutoff) => lt(importJobs.createdAt, cutoff),
  },
]

/**
 * Purge les tables de logs append-only au-delà de la rétention (défaut 6 mois), pour éviter
 * qu'elles ne grossissent indéfiniment. Pilotée par un cron quotidien (voir cron.json).
 * Idempotente : ré-exécutable sans risque.
 */
export async function purgeLogs(options: PurgeLogsOptions = {}): Promise<void> {
  const { dryRun = false, verbose = false, retentionMonths = DEFAULT_RETENTION_MONTHS } = options
  const cutoff = subMonths(new Date(), retentionMonths)

  console.log(`🧹 Purge des logs (rétention ${retentionMonths} mois, coupure au ${cutoff.toISOString()})...`)

  try {
    let total = 0

    for (const target of TARGETS) {
      const where = target.where(cutoff)

      if (verbose && target.detail) {
        console.log(`  • ${target.label} — ${target.detail}`)
      }

      if (dryRun) {
        const count = await db.$count(target.table, where)
        total += count
        console.log(`  [dry-run] ${target.label} : ${count} ligne(s) seraient supprimées`)
        continue
      }

      const deleted = await db.delete(target.table).where(where).returning({ id: target.table.id })
      total += deleted.length
      console.log(`  ✅ ${target.label} : ${deleted.length} ligne(s) supprimées`)
    }

    console.log(`\n${dryRun ? '[dry-run] ' : ''}Total : ${total} ligne(s)${dryRun ? ' candidates' : ' supprimées'}`)
  } catch (error) {
    console.error(`\n❌ Purge échouée : ${error instanceof Error ? error.message : String(error)}`)
    await captureCliException(error)
    throw error
  } finally {
    await closeDb()
  }
}
