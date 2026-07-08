import { sendPendingAlertJobs } from '~/server/services/alert-sender'

interface SendAlertJobsOptions {
  dryRun?: boolean
  verbose?: boolean
}

export async function sendAlertJobs(options: SendAlertJobsOptions): Promise<void> {
  console.log('📬 Envoi des alertes logements en attente...')

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

  if (result.failed > 0) process.exit(1)
}
