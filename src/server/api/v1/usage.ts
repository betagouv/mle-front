import * as Sentry from '@sentry/nextjs'
import { format } from 'date-fns'
import { sql } from 'drizzle-orm'
import { db } from '~/server/db'
import { apiKeyUsageDaily } from '~/server/db/schema/api-key-usage'

/**
 * Incrémente le compteur journalier d'usage d'une clé (UPSERT +1 sur la ligne du jour).
 * Best-effort : une erreur d'écriture des stats ne doit jamais faire échouer la requête API.
 */
export async function recordApiKeyUsage(apiKeyId: string) {
  const day = format(new Date(), 'yyyy-MM-dd')
  try {
    await db
      .insert(apiKeyUsageDaily)
      .values({ apiKeyId, day, count: 1 })
      .onConflictDoUpdate({
        target: [apiKeyUsageDaily.apiKeyId, apiKeyUsageDaily.day],
        set: { count: sql`${apiKeyUsageDaily.count} + 1` },
      })
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'api/v1', step: 'recordApiKeyUsage' } })
  }
}
