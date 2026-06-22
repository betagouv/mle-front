import { and, count, eq, inArray, lt, or, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { accommodations, alertJobs, user } from '~/server/db/schema'
import { env } from '~/server/env'
import { sendStudentAlertEmail } from './brevo'

// Nombre maximal de tentatives d'envoi par job (1 envoi initial + retries).
// Au-delà, un job `failed` n'est plus replanifié et reste en échec définitif.
export const MAX_ATTEMPTS = 3

export type AlertSenderResult = {
  sent: number
  failed: number
  requeued: number
}

type UserAlertBatch = {
  email: string
  firstname: string | null
  jobIds: number[]
  accomodations: { nom: string; url: string }[]
}

export async function sendPendingAlertJobs(options: { dryRun?: boolean; verbose?: boolean } = {}): Promise<AlertSenderResult> {
  // Jobs en échec encore éligibles à une nouvelle tentative (sous le plafond).
  const retryableFailed = and(eq(alertJobs.status, 'failed'), lt(alertJobs.attempts, MAX_ATTEMPTS))

  // Replanification : on repasse ces jobs en `pending` (et on efface l'erreur précédente)
  // afin qu'ils soient repris par le traitement ci-dessous. En dry-run on ne touche pas
  // à la BDD : on se contente de les compter et de les inclure dans la sélection.
  let requeued = 0
  if (options.dryRun) {
    const [result] = await db.select({ value: count() }).from(alertJobs).where(retryableFailed)
    requeued = result?.value ?? 0
  } else {
    const rows = await db.update(alertJobs).set({ status: 'pending', error: null }).where(retryableFailed).returning({ id: alertJobs.id })
    requeued = rows.length
  }
  if (options.verbose && requeued > 0) {
    console.log(`  ↺ ${requeued} job(s) en échec replanifié(s) pour nouvelle tentative`)
  }

  // En exécution réelle, les jobs replanifiés sont déjà `pending`. En dry-run rien n'a été
  // écrit, donc on ajoute explicitement les `failed` éligibles à la sélection simulée.
  const selection = options.dryRun ? or(eq(alertJobs.status, 'pending'), retryableFailed) : eq(alertJobs.status, 'pending')

  const pendingJobs = await db
    .select({
      jobId: alertJobs.id,
      userEmail: user.email,
      userFirstname: user.firstname,
      accommodationName: accommodations.name,
      accommodationSlug: accommodations.slug,
    })
    .from(alertJobs)
    .innerJoin(user, eq(alertJobs.userId, user.id))
    .innerJoin(accommodations, eq(alertJobs.accommodationId, accommodations.id))
    .where(selection)

  if (pendingJobs.length === 0) return { sent: 0, failed: 0, requeued }

  const byUser = new Map<string, UserAlertBatch>()
  for (const job of pendingJobs) {
    if (!byUser.has(job.userEmail)) {
      byUser.set(job.userEmail, {
        email: job.userEmail,
        firstname: job.userFirstname,
        jobIds: [],
        accomodations: [],
      })
    }
    const batch = byUser.get(job.userEmail)!
    batch.jobIds.push(job.jobId)
    batch.accomodations.push({
      nom: job.accommodationName,
      url: `${env.BASE_URL}logement/${job.accommodationSlug}`,
    })
  }

  let sent = 0
  let failed = 0

  for (const batch of byUser.values()) {
    if (options.dryRun) {
      if (options.verbose) {
        console.log(`  [dry-run] ${batch.email} — ${batch.accomodations.length} logement(s)`)
      }
      sent++
      continue
    }

    try {
      await sendStudentAlertEmail(batch.email, { firstName: batch.firstname ?? '', acccomodations: batch.accomodations })
      await db
        .update(alertJobs)
        .set({ status: 'sent', sentAt: new Date(), attempts: sql`${alertJobs.attempts} + 1` })
        .where(inArray(alertJobs.id, batch.jobIds))
      if (options.verbose) console.log(`  ✓ ${batch.email} — ${batch.accomodations.length} logement(s)`)
      sent++
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      await db
        .update(alertJobs)
        .set({ status: 'failed', error: errorMessage, attempts: sql`${alertJobs.attempts} + 1` })
        .where(inArray(alertJobs.id, batch.jobIds))
      console.error(`  ✗ ${batch.email} — ${errorMessage}`)
      failed++
    }
  }

  return { sent, failed, requeued }
}
