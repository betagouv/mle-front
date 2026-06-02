import { subDays } from 'date-fns'
import { and, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import { closeDb, db } from '~/server/db'
import { accommodations, owners } from '~/server/db/schema'
import { user } from '~/server/db/schema/auth'
import { sendOwnerAvailabilityReminderEmail, sendOwnerAvailabilityReminderJ30Email } from '~/server/services/brevo'

export interface Options {
  days: 7 | 30
  dryRun?: boolean
  verbose?: boolean
}

const CONFIGS = {
  7: {
    label: 'J+7',
    cutoffDays: 7,
    getSentAt: () => owners.availabilityReminderSentAt,
    setSentAt: () => ({ availabilityReminderSentAt: new Date() }),
    sendEmail: sendOwnerAvailabilityReminderEmail,
  },
  30: {
    label: 'J+30',
    // Déclenché 23 jours après l'envoi du rappel J+7
    cutoffDays: 23,
    getSentAt: () => owners.availabilityReminderJ30SentAt,
    setSentAt: () => ({ availabilityReminderJ30SentAt: new Date() }),
    sendEmail: sendOwnerAvailabilityReminderJ30Email,
  },
} as const

export async function sendOwnerAvailabilityReminder(options: Options): Promise<void> {
  const { days, dryRun = false, verbose = false } = options
  const config = CONFIGS[days]

  try {
    // Étape 1 : owner IDs ayant au moins une résidence avec toutes les dispos null
    const ownersWithNoAvailability = await db
      .selectDistinct({ ownerId: accommodations.ownerId })
      .from(accommodations)
      .where(
        and(
          isNull(accommodations.nbT1Available),
          isNull(accommodations.nbT1BisAvailable),
          isNull(accommodations.nbT2Available),
          isNull(accommodations.nbT3Available),
          isNull(accommodations.nbT4Available),
          isNull(accommodations.nbT5Available),
          isNull(accommodations.nbT6Available),
          isNull(accommodations.nbT7MoreAvailable),
        ),
      )

    const ownerIdsWithNoAvailability = ownersWithNoAvailability.map((r) => r.ownerId).filter((id): id is number => id !== null)

    if (ownerIdsWithNoAvailability.length === 0) {
      console.log('✅ Aucun owner à notifier (aucune résidence sans disponibilité)')
      return
    }

    // Étape 2 : owners éligibles selon le palier
    const cutoffIso = subDays(new Date(), config.cutoffDays).toISOString()

    const eligibleOwnerRows =
      days === 7
        ? // J+7 : compte créé il y a >= 7 jours (via le plus ancien user lié)
          await db
            .select({ ownerId: owners.id, ownerName: owners.name })
            .from(owners)
            .innerJoin(user, sql`${user.ownerId} = ${owners.id}`)
            .where(and(isNull(owners.availabilityReminderSentAt), inArray(owners.id, ownerIdsWithNoAvailability)))
            .groupBy(owners.id, owners.name)
            .having(sql`MIN(${user.createdAt}) <= ${cutoffIso}::timestamptz`)
        : // J+30 : rappel J+7 envoyé il y a >= 23 jours
          await db
            .select({ ownerId: owners.id, ownerName: owners.name })
            .from(owners)
            .where(
              and(
                isNull(owners.availabilityReminderJ30SentAt),
                isNotNull(owners.availabilityReminderSentAt),
                sql`${owners.availabilityReminderSentAt} <= ${cutoffIso}::timestamptz`,
                inArray(owners.id, ownerIdsWithNoAvailability),
              ),
            )

    if (eligibleOwnerRows.length === 0) {
      const reason = days === 7 ? 'créés depuis moins de 7 jours' : 'rappel J+7 non envoyé ou envoyé il y a moins de 23 jours'
      console.log(`✅ Aucun owner éligible (tous notifiés ou ${reason})`)
      return
    }

    console.log(`→ ${eligibleOwnerRows.length} owner(s) éligible(s)`)

    // Étape 3 : récupérer tous les emails des users liés à ces owners
    const eligibleOwnerIds = eligibleOwnerRows.map((r) => r.ownerId)

    const ownerUsers = await db
      .select({ ownerId: user.ownerId, email: user.email })
      .from(user)
      .where(and(sql`${user.ownerId} IS NOT NULL`, inArray(sql`${user.ownerId}`, eligibleOwnerIds)))

    const emailsByOwnerId = new Map<number, string[]>()
    for (const row of ownerUsers) {
      if (row.ownerId === null) continue
      const emails = emailsByOwnerId.get(row.ownerId) ?? []
      emails.push(row.email)
      emailsByOwnerId.set(row.ownerId, emails)
    }

    let sent = 0
    let skipped = 0
    const errors: string[] = []

    for (const owner of eligibleOwnerRows) {
      const emails = emailsByOwnerId.get(owner.ownerId) ?? []

      if (emails.length === 0) {
        if (verbose) console.log(`  ⏭️  Owner "${owner.ownerName}" (id=${owner.ownerId}) — aucun user lié`)
        skipped++
        continue
      }

      if (verbose) {
        console.log(`  📧 Owner "${owner.ownerName}" (id=${owner.ownerId}) — ${emails.length} email(s) : ${emails.join(', ')}`)
      }

      if (!dryRun) {
        for (const email of emails) {
          try {
            await config.sendEmail(email)
            sent++
          } catch (err) {
            const msg = `Owner "${owner.ownerName}" (${email}) : ${err instanceof Error ? err.message : String(err)}`
            console.error(`  ❌ ${msg}`)
            errors.push(msg)
          }
        }

        await db.update(owners).set(config.setSentAt()).where(sql`${owners.id} = ${owner.ownerId}`)
      } else {
        sent += emails.length
      }
    }

    console.log(`\n✅ Rappels ${config.label} accommodationAvailability${dryRun ? ' (dry-run)' : ''} :`)
    console.log(`  📧 Envoyés : ${sent}`)
    console.log(`  ⏭️  Ignorés : ${skipped}`)
    if (errors.length > 0) {
      console.log(`  ❌ Erreurs (${errors.length}) :`)
      for (const err of errors) console.log(`    - ${err}`)
    }
  } finally {
    await closeDb()
  }
}
