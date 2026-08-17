import { subMonths } from 'date-fns'
import { and, eq, inArray, lt, type SQL, sql } from 'drizzle-orm'
import type { PgColumn, PgTable } from 'drizzle-orm/pg-core'
import { closeDb, db } from '~/server/db'
import { activityLog } from '~/server/db/schema/activity-log'
import { alertJobs } from '~/server/db/schema/alert-jobs'
import { importJobs } from '~/server/db/schema/import-jobs'
import { trackingEvents } from '~/server/db/schema/tracking-events'
import { captureCliException } from '../sentry'
import { archivePurgedRows } from '../utils/purge-archive'

export interface PurgeLogsOptions {
  dryRun?: boolean
  verbose?: boolean
  /** Écrase la rétention de **toutes** les tables. Sans cette option, chacune garde la sienne. */
  retentionMonths?: number
  /** Plafond de lignes supprimées par table et par run. */
  maxRows?: number
  /** Purge sans déposer d'archive dans S3 (dev, ou rattrapage assumé). */
  noArchive?: boolean
  /** Restreint le run à une seule table (utile pour étaler la première purge). */
  table?: string
}

/**
 * Les rétentions sont dimensionnées table par table, sur deux critères : ce que la table coûte,
 * et ce qui la relit. Mesures d'août 2026 sur une restauration de la prod :
 *
 * | table            | taille  | octets/ligne | croissance   |
 * |------------------|---------|--------------|--------------|
 * | `tracking_event` | 805 Mo  | 321          | ~385 Mo/mois |
 * | `alert_job`      | 11 Mo   | 175          | ~8,8 Mo/mois |
 * | `activity_log`   | 5 Mo    | 1 053        | ~0,5 Mo/mois, **en décroissance** |
 * | `import_job`     | 1,9 Mo  | 4 148        | ~0,2 Mo/mois |
 *
 * `tracking_event` pèse 98 % du total et croît 40 fois plus vite que la somme des trois autres :
 * c'est la seule dont la rétention se paie en gigaoctets, donc la seule à purger court. Sur les
 * autres, allonger la rétention coûte quelques dizaines de mégaoctets sur plusieurs années —
 * moins cher qu'un écran d'admin qui affiche un trou.
 */

/** Jamais relu : ni écran, ni API. `onConflictDoNothing` du détecteur s'appuie sur les index
 * uniques partiels, qui ne couvrent que `pending` / `failed` — un job `sent` ne bloque aucune
 * réémission. Douze mois ne servent donc qu'au diagnostic a posteriori (~105 Mo/an). */
const ALERT_JOB_RETENTION_MONTHS = 12

/**
 * L'écran « Statistiques gestionnaires » laisse choisir **une plage de dates libre** (deux champs
 * `type="date"`, au-delà des présélections 7/30/90 jours) : purger court ferait silencieusement
 * retourner zéro sur les plages anciennes. La table coûte 5 Mo et **décroît** (2 431 lignes en
 * avril 2026, 115 en août) : la rétention n'est qu'un garde-fou, elle ne mordra jamais en
 * pratique.
 */
const ACTIVITY_LOG_RETENTION_MONTHS = 36

/**
 * L'admin « Tâches planifiées » affiche le **dernier run de chaque type de cron**
 * (`selectDistinctOn`). Certains sont trimestriels (`sync rents`) : une rétention courte
 * risquerait d'effacer le seul enregistrement d'un job rare et de l'afficher comme jamais
 * exécuté. À 0,2 Mo/mois, deux ans écartent le cas sans rien coûter.
 */
const IMPORT_JOB_RETENTION_MONTHS = 24

/**
 * `tracking_event` alimente le tableau de bord bailleur (`owner-statistics.ts`). Le sélecteur
 * n'expose que `7d` / `30d` / `90d` : **90 jours sont affichés**, mais une requête remonte à
 * 180 — `countConsultOffer` sur la période précédente, qui alimente le badge d'évolution des
 * consultations d'offre en période `90d`.
 *
 * Sept mois couvrent donc ces 180 jours avec ~33 jours de marge. Comme la purge est mensuelle,
 * une ligne vit en pratique entre 7 et 8 mois : le plateau visé est d'environ 8 mois de données.
 *
 * Descendre à 3 mois ferait disparaître ce badge (`computeDelta` renvoie `null` sur une période
 * précédente vide) — l'écran ne casse pas, il ment. Monter au-delà n'achèterait qu'une
 * comparaison à N-1 qui n'existe dans aucun écran : si le besoin apparaît, c'est un rollup
 * journalier qu'il faut, pas de la rétention brute.
 */
const TRACKING_RETENTION_MONTHS = 7

const DELETE_BATCH_SIZE = 10_000

/**
 * Plafond de lignes traitées par table et par run. Le cron étant mensuel, un run de régime
 * traite un mois d'événements — environ 1,2 M lignes sur `tracking_event` au rythme actuel : le
 * plafond doit rester nettement au-dessus pour ne pas mordre tous les mois. Il ne sert qu'à
 * borner le premier passage, qui rattrape l'historique, et son dépassement est journalisé —
 * jamais tronqué en silence.
 */
const DEFAULT_MAX_ROWS = 2_000_000

interface PurgeTarget {
  /** Nom réel de la table en base : sert aussi de préfixe de clé S3. */
  label: string
  table: PgTable & { id: PgColumn; createdAt: PgColumn }
  retentionMonths: number
  /** Condition des lignes à supprimer (plus vieilles que le seuil de rétention). */
  where: (cutoff: Date) => SQL
  /** Détail affiché en --verbose pour expliquer le filtre. */
  detail?: string
}

export const TARGETS: PurgeTarget[] = [
  {
    label: 'tracking_event',
    table: trackingEvents,
    retentionMonths: TRACKING_RETENTION_MONTHS,
    where: (cutoff) => lt(trackingEvents.createdAt, cutoff),
    detail: 'événements de navigation (vues, recherches, consultations d’offre)',
  },
  {
    label: 'activity_log',
    table: activityLog,
    retentionMonths: ACTIVITY_LOG_RETENTION_MONTHS,
    where: (cutoff) => lt(activityLog.createdAt, cutoff),
    detail: 'garde-fou : la plage de dates de l’admin est libre, et la table décroît',
  },
  {
    label: 'alert_job',
    table: alertJobs,
    retentionMonths: ALERT_JOB_RETENTION_MONTHS,
    // On ne purge que les jobs terminés : un job `pending` reste actionnable par le sender.
    where: (cutoff) => and(lt(alertJobs.createdAt, cutoff), inArray(alertJobs.status, ['sent', 'failed'])) as SQL,
    detail: "statuts 'sent' et 'failed' uniquement (les 'pending' sont conservés)",
  },
  {
    label: 'import_job',
    table: importJobs,
    retentionMonths: IMPORT_JOB_RETENTION_MONTHS,
    where: (cutoff) => lt(importJobs.createdAt, cutoff),
    detail: 'l’admin affiche le dernier run de chaque cron, y compris les trimestriels',
  },
]

interface TargetOutcome {
  table: string
  deleted: number
  archiveKey?: string
  archiveBytes?: number
  /** `true` si le plafond `maxRows` a coupé le run avant d'avoir tout purgé. */
  capped: boolean
}

/** Reste-t-il des lignes purgeables après ce run ? Beaucoup moins coûteux qu'un `count(*)`. */
async function hasRemainingRows(target: PurgeTarget, where: SQL): Promise<boolean> {
  const rows = await db.execute(sql`select 1 from ${target.table} where ${where} limit 1`)
  return rows.length > 0
}

/**
 * Supprime par lots bornés à `maxId`, l'identifiant le plus élevé effectivement archivé. Sans
 * cette borne, une ligne insérée entre l'archivage et la suppression pourrait être supprimée
 * sans archive — impossible ici, puisque les identifiants sont croissants.
 */
async function deleteInBatches(target: PurgeTarget, where: SQL, maxId: number): Promise<number> {
  let deleted = 0
  let batch = 0

  // Un lot plein signifie qu'il en reste probablement ; un lot incomplet est forcément le dernier.
  // La boucle termine toujours : chaque tour supprime les lignes qu'il vient de compter, donc
  // l'ensemble ciblé décroît strictement jusqu'à épuisement.
  do {
    const rows = await db.execute(sql`
      with doomed as (
        select ${target.table.id} as id
        from ${target.table}
        where ${where} and ${target.table.id} <= ${maxId}
        order by ${target.table.id}
        limit ${DELETE_BATCH_SIZE}
      )
      delete from ${target.table}
      where ${target.table.id} in (select id from doomed)
      returning ${target.table.id} as id
    `)

    batch = rows.length
    deleted += batch
  } while (batch === DELETE_BATCH_SIZE)

  return deleted
}

/**
 * Plus grand identifiant purgeable dans la limite du plafond du run. Utilisé quand l'archivage
 * est désactivé : sinon, c'est l'archive qui fournit cette borne.
 */
async function findCeilingId(target: PurgeTarget, where: SQL, maxRows: number): Promise<number | null> {
  const rows = (await db.execute(sql`
    select ${target.table.id} as id
    from ${target.table}
    where ${where}
    order by ${target.table.id}
    limit 1
    offset ${maxRows - 1}
  `)) as unknown as { id: string | number }[]

  if (rows.length > 0) return Number(rows[0].id)

  // Moins de `maxRows` lignes concernées : on prend le plus grand identifiant purgeable.
  const [last] = (await db.execute(sql`
    select ${target.table.id} as id from ${target.table} where ${where} order by ${target.table.id} desc limit 1
  `)) as unknown as { id: string | number }[]

  return last ? Number(last.id) : null
}

async function purgeTarget(
  target: PurgeTarget,
  cutoff: Date,
  retentionMonths: number,
  options: PurgeLogsOptions & { maxRows: number },
): Promise<TargetOutcome> {
  const { dryRun = false, verbose = false, maxRows, noArchive = false } = options
  const where = target.where(cutoff)

  if (verbose) {
    console.log(`  • ${target.label} — rétention ${retentionMonths} mois, coupure au ${cutoff.toISOString()}`)
    if (target.detail) console.log(`      ${target.detail}`)
  }

  if (dryRun) {
    const candidates = await db.$count(target.table, where)
    console.log(`  [dry-run] ${target.label} : ${candidates} ligne(s) seraient supprimées (rétention ${retentionMonths} mois)`)
    return { table: target.label, deleted: 0, capped: candidates > maxRows }
  }

  if (noArchive) {
    const ceilingId = await findCeilingId(target, where, maxRows)
    if (ceilingId === null) {
      console.log(`  ✅ ${target.label} : rien à purger`)
      return { table: target.label, deleted: 0, capped: false }
    }

    const deleted = await deleteInBatches(target, where, ceilingId)
    console.log(`  ✅ ${target.label} : ${deleted} ligne(s) supprimées (sans archive)`)
    return { table: target.label, deleted, capped: await hasRemainingRows(target, where) }
  }

  const archive = await archivePurgedRows({ table: target.table, tableName: target.label, where, maxRows, verbose })
  if (!archive) {
    console.log(`  ✅ ${target.label} : rien à purger`)
    return { table: target.label, deleted: 0, capped: false }
  }

  const deleted = await deleteInBatches(target, where, archive.maxId)
  console.log(`  ✅ ${target.label} : ${deleted} ligne(s) supprimées, archivées dans ${archive.key}`)

  return {
    table: target.label,
    deleted,
    archiveKey: archive.key,
    archiveBytes: archive.bytes,
    capped: await hasRemainingRows(target, where),
  }
}

/**
 * Purge les tables append-only au-delà de leur rétention, pour éviter qu'elles ne grossissent
 * indéfiniment. Chaque lot supprimé est d'abord archivé dans S3 en NDJSON gzippé, pour pouvoir
 * être relu ou réinjecté en cas de besoin. Pilotée par un cron mensuel (voir `cron.json`).
 * Idempotente : ré-exécutable sans risque.
 */
export async function purgeLogs(options: PurgeLogsOptions = {}): Promise<void> {
  const { dryRun = false, retentionMonths, maxRows = DEFAULT_MAX_ROWS, noArchive = false, table } = options

  const targets = table ? TARGETS.filter((target) => target.label === table) : TARGETS
  if (targets.length === 0) {
    throw new Error(`Table inconnue : "${table}". Tables purgeables : ${TARGETS.map((target) => target.label).join(', ')}`)
  }

  console.log(`🧹 Purge des logs (rétention ${retentionMonths ? `${retentionMonths} mois, forcée` : 'propre à chaque table'})...`)
  if (noArchive && !dryRun) console.log('  ⚠️  --no-archive : les lignes seront supprimées sans copie dans S3.')

  // Suivi du run dans `import_job` (visible dans l'admin « Tâches planifiées »), comme
  // `purge-contact-requests`. Pas de trace en dry-run : rien n'est écrit.
  let jobId: number | null = null
  if (!dryRun) {
    const [job] = await db
      .insert(importJobs)
      .values({ type: 'purge-logs', status: 'running', source: 'purge-logs', createdBy: 'cron', startedAt: new Date() })
      .returning({ id: importJobs.id })
    jobId = job.id
  }

  try {
    const outcomes: TargetOutcome[] = []

    for (const target of targets) {
      const retention = retentionMonths ?? target.retentionMonths
      const cutoff = subMonths(new Date(), retention)
      outcomes.push(await purgeTarget(target, cutoff, retention, { ...options, maxRows }))
    }

    const total = outcomes.reduce((sum, outcome) => sum + outcome.deleted, 0)
    console.log(`\n${dryRun ? '[dry-run] Total : lignes candidates comptées ci-dessus' : `Total : ${total} ligne(s) supprimées`}`)

    const capped = outcomes.filter((outcome) => outcome.capped).map((outcome) => outcome.table)
    if (capped.length > 0) {
      console.log(`⚠️  Plafond de ${maxRows} ligne(s)/table atteint sur : ${capped.join(', ')}. Relancer la commande pour purger le reste.`)
    }

    if (jobId !== null) {
      await db
        .update(importJobs)
        .set({
          status: 'done',
          endedAt: new Date(),
          updatedAt: new Date(),
          summary: { deleted: total, context: { tables: outcomes } },
        })
        .where(eq(importJobs.id, jobId))
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`\n❌ Purge échouée : ${message}`)

    if (jobId !== null) {
      await db
        .update(importJobs)
        .set({ status: 'error', endedAt: new Date(), updatedAt: new Date(), summary: { errors: [message] } })
        .where(eq(importJobs.id, jobId))
    }

    await captureCliException(error)
    throw error
  } finally {
    await closeDb()
  }
}
