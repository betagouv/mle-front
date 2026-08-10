import { closeDb } from '~/server/db'
import { env } from '~/server/env'
import { MAX_ATTEMPTS, sendPendingAlertJobs } from '~/server/services/alert-sender'
import { CronPartialFailure } from '../cron-failure'

interface SendAlertJobsOptions {
  dryRun?: boolean
  verbose?: boolean
}

export async function sendAlertJobs(options: SendAlertJobsOptions): Promise<void> {
  if (env.NEXT_PUBLIC_APP_ENV !== 'production' && !options.dryRun) {
    console.info(`[${env.NEXT_PUBLIC_APP_ENV}] send-alert-jobs ignoré hors production (utilisez --dry-run pour simuler)`)
    return
  }

  console.log('📬 Envoi des alertes logements en attente...')

  try {
    const result = await sendPendingAlertJobs({
      dryRun: options.dryRun,
      verbose: options.verbose,
    })

    if (options.dryRun) {
      console.log(`\n  [dry-run] ${result.requeued} job(s) en échec auraient été replanifiés`)
      console.log(`  [dry-run] ${result.sent} email(s) auraient été envoyés`)
      return
    }

    console.log(`\n  Replanifiés : ${result.requeued}`)
    console.log(`  Envoyés : ${result.sent}`)
    console.log(`  Échoués : ${result.failed}`)
    console.log(`  Définitivement perdus : ${result.exhausted}`)

    // Les échecs sous le plafond seront retentés au prochain passage (toutes les 30 min) : les
    // signaler créerait du bruit pour rien. Seuls les jobs à bout de tentatives sont une perte.
    if (result.exhausted > 0) {
      throw new CronPartialFailure(`${result.exhausted} alerte(s) définitivement non envoyée(s) après ${MAX_ATTEMPTS} tentatives`)
    }
  } finally {
    await closeDb()
  }
}
