import * as Sentry from '@sentry/nextjs'
import type { MiddlewareHandler } from 'hono'
import { env } from '~/server/env'
import { auth } from '~/services/better-auth'
import { recordApiKeyUsage } from './usage'

export type ApiV1Env = { Variables: { apiKey: { id: string; name: string | null } } }

/** Bloque l'API v1 quand elle est désactivée par le flag d'environnement. */
export const requireFeatureEnabled: MiddlewareHandler<ApiV1Env> = async (c, next) => {
  if (!env.API_V1_ENABLED) {
    return c.json({ error: "L'API v1 est désactivée." }, 404)
  }
  await next()
}

/**
 * Vérifie la clé d'API (en-tête `x-api-key`) via Better Auth. `verifyApiKey` applique aussi le
 * rate-limit par clé et incrémente le compteur d'usage (attribution du trafic). En cas de dépassement,
 * on renvoie un 429 ; clé absente/invalide → 401.
 */
export const apiKeyMiddleware: MiddlewareHandler<ApiV1Env> = async (c, next) => {
  const key = c.req.header('x-api-key')
  if (!key) {
    return c.json({ error: "Clé d'API manquante. Fournissez l'en-tête « x-api-key »." }, 401)
  }

  let result: Awaited<ReturnType<typeof auth.api.verifyApiKey>>
  try {
    result = await auth.api.verifyApiKey({ body: { key } })
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'api/v1', step: 'verifyApiKey' } })
    return c.json({ error: "Impossible de vérifier la clé d'API." }, 500)
  }

  if (!result.valid || !result.key) {
    const code = result.error?.code
    if (code === 'RATE_LIMITED' || code === 'RATE_LIMIT_EXCEEDED' || code === 'USAGE_EXCEEDED') {
      return c.json({ error: 'Quota de requêtes dépassé. Réessayez plus tard.' }, 429)
    }
    return c.json({ error: "Clé d'API invalide." }, 401)
  }

  const apiKeyId = String(result.key.id)
  c.set('apiKey', { id: apiKeyId, name: (result.key.name as string | null) ?? null })
  // Comptage du trafic par jour et par consommateur (stats de consommation).
  await recordApiKeyUsage(apiKeyId)
  await next()
}
