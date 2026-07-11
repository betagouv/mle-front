import { OpenAPIHono, type z } from '@hono/zod-openapi'
import { ZApiAccommodationsResponse, ZApiError } from '~/schemas/api/v1'
import type { queryPublicAccommodations } from '~/server/accommodations/list-query'
import { createCallerFactory } from '~/server/trpc/init'
import { appRouter } from '~/server/trpc/router'
import type { ApiV1Env } from './middlewares'

/** Fabrique un OpenAPIHono partageant la gestion d'erreur de validation (query invalide → 400 JSON lisible). */
export const createApiHono = () =>
  new OpenAPIHono<ApiV1Env>({
    defaultHook: (result, c) => {
      if (!result.success) {
        return c.json({ error: `Paramètres invalides : ${result.error.issues.map((i) => i.message).join(', ')}` }, 400)
      }
    },
  })

// Caller tRPC public (contexte sans session) : réutilise la logique interne (territoires, détail d'une
// résidence) sans repasser par le transport HTTP/superjson.
export const publicCaller = createCallerFactory(appRouter)({ session: null })

export const errorResponses = {
  400: { description: 'Paramètres invalides.', content: { 'application/json': { schema: ZApiError } } },
  401: { description: "Clé d'API manquante ou invalide.", content: { 'application/json': { schema: ZApiError } } },
  429: { description: 'Quota de requêtes dépassé.', content: { 'application/json': { schema: ZApiError } } },
} as const

export const security = [{ ApiKeyAuth: [] as string[] }]

type ListResult = Awaited<ReturnType<typeof queryPublicAccommodations>>
type ListFeature = ListResult['results']['features'][number]
// Sous-ensemble structurel commun à `queryPublicAccommodations` et au caller `listExpandedByCity`
// (dont le early-return « ville introuvable » n'inclut pas `crousCounts`).
export type SerializableList = {
  count: number
  next: string | null
  previous: string | null
  min_price: number | null
  max_price: number | null
  page_size: number
  results: { features: ListFeature[] }
}

/** Sérialise une feature (Date → string ISO) pour une sortie JSON conforme au schéma OpenAPI. */
const serializeFeature = (f: ListFeature): z.infer<typeof ZApiAccommodationsResponse>['results']['features'][number] => {
  const { updated_at, ...rest } = f.properties
  return {
    geometry: f.geometry,
    id: f.id,
    properties: { ...rest, updated_at: updated_at instanceof Date ? updated_at.toISOString() : String(updated_at ?? '') },
  }
}

export const serializeList = (r: SerializableList): z.infer<typeof ZApiAccommodationsResponse> => ({
  count: r.count,
  next: r.next,
  previous: r.previous,
  min_price: r.min_price,
  max_price: r.max_price,
  page_size: r.page_size,
  results: { features: r.results.features.map(serializeFeature) },
})
