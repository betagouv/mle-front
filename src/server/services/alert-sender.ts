import { eq, inArray, sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { accommodations, alertJobs, user } from '~/server/db/schema'
import { env } from '~/server/env'
import { sendStudentAlertEmail } from './brevo'

export type AlertSenderResult = {
  sent: number
  failed: number
}

type UserAlertBatch = {
  email: string
  firstname: string | null
  jobIds: number[]
  accomodations: { nom: string; url: string }[]
}

export async function sendPendingAlertJobs(options: { dryRun?: boolean; verbose?: boolean } = {}): Promise<AlertSenderResult> {
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
    .where(eq(alertJobs.status, 'pending'))

  if (pendingJobs.length === 0) return { sent: 0, failed: 0 }

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

  return { sent, failed }
}
