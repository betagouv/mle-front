import { closeDb, db } from '~/server/db'
import { session } from '~/server/db/schema/auth'
import { captureCliException } from '../sentry'

interface ClearSessionsOptions {
  dryRun?: boolean
}

export async function clearSessions(options: ClearSessionsOptions): Promise<void> {
  console.log('🔐 Suppression des sessions actives...')

  try {
    if (options.dryRun) {
      const count = await db.$count(session)
      console.log(`\n  [dry-run] ${count} session(s) auraient été supprimées`)
      return
    }

    const deleted = await db.delete(session).returning({ id: session.id })
    console.log(`\n  ✅ ${deleted.length} session(s) supprimées`)
  } catch (error) {
    console.error(`\n❌ Suppression échouée : ${error instanceof Error ? error.message : String(error)}`)
    await captureCliException(error)
    throw error
  } finally {
    await closeDb()
  }
}
