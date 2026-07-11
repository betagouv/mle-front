import { createRoute } from '@hono/zod-openapi'
import { TRPCError } from '@trpc/server'
import { HTTPException } from 'hono/http-exception'
import {
  ZAccommodationsListQuery,
  ZApiAccommodationDetail,
  ZApiAccommodationsResponse,
  ZApiError,
  ZNearbyQuery,
  ZSlugParam,
} from '~/schemas/api/v1'
import { queryPublicAccommodations } from '~/server/accommodations/list-query'
import { createApiHono, errorResponses, publicCaller, security, serializeList } from '../shared'

export const accommodationsApp = createApiHono()

const listRoute = createRoute({
  method: 'get',
  path: '/accommodations',
  tags: ['Résidences'],
  summary: 'Lister les résidences',
  description:
    "Liste paginée des résidences publiées (FeatureCollection GeoJSON), identique à ce qu'affiche la carte. " +
    'Les filtres de localisation (villes, départements, académies) sont géométriques (ST_Within).',
  security,
  request: { query: ZAccommodationsListQuery },
  responses: {
    200: { description: 'Liste paginée de résidences.', content: { 'application/json': { schema: ZApiAccommodationsResponse } } },
    ...errorResponses,
  },
})

accommodationsApp.openapi(listRoute, async (c) => {
  const q = c.req.valid('query')
  const result = await queryPublicAccommodations({
    page: q.page,
    pageSize: q.page_size,
    citySlugs: q.city_slugs,
    departments: q.department,
    academies: q.academie,
    postalCodes: q.postal_codes,
    bbox: q.bbox,
    center: q.center,
    radius: q.radius,
    isAccessible: q.accessible,
    hasColiving: q.coliving,
    onlyWithAvailability: q.available,
    priceMax: q.price_max,
    viewCrous: q.crous,
    ownerSlug: q.owner_slug,
  })
  return c.json(serializeList(result), 200)
})

const nearbyRoute = createRoute({
  method: 'get',
  path: '/accommodations/nearby',
  tags: ['Résidences'],
  summary: 'Résidences à proximité',
  description: 'Résidences autour d\'un point (`center` = "lng,lat") ou autour d\'une ville (`city` = slug) dans un rayon donné.',
  security,
  request: { query: ZNearbyQuery },
  responses: {
    200: {
      description: 'Liste paginée de résidences à proximité.',
      content: { 'application/json': { schema: ZApiAccommodationsResponse } },
    },
    ...errorResponses,
  },
})

accommodationsApp.openapi(nearbyRoute, async (c) => {
  const q = c.req.valid('query')
  if (q.city) {
    const result = await publicCaller.accommodations.listExpandedByCity({
      city: q.city,
      radius: q.radius,
      page: q.page,
      pageSize: q.page_size,
      isAccessible: q.accessible,
      hasColiving: q.coliving,
      onlyWithAvailability: q.available,
      priceMax: q.price_max,
      viewCrous: q.crous ?? false,
    })
    return c.json(serializeList(result), 200)
  }
  if (q.center) {
    const result = await queryPublicAccommodations({
      page: q.page,
      pageSize: q.page_size,
      center: q.center,
      radius: q.radius,
      isAccessible: q.accessible,
      hasColiving: q.coliving,
      onlyWithAvailability: q.available,
      priceMax: q.price_max,
      viewCrous: q.crous,
    })
    return c.json(serializeList(result), 200)
  }
  throw new HTTPException(400, { message: 'Fournissez « center » (lng,lat) ou « city » (slug).' })
})

const detailRoute = createRoute({
  method: 'get',
  path: '/accommodations/{slug}',
  tags: ['Résidences'],
  summary: "Détail d'une résidence",
  description: "Détail complet d'une résidence par son slug (adresses, typologies, prix, équipements, gestionnaire).",
  security,
  request: { params: ZSlugParam },
  responses: {
    200: { description: 'Détail de la résidence.', content: { 'application/json': { schema: ZApiAccommodationDetail } } },
    404: { description: 'Résidence introuvable.', content: { 'application/json': { schema: ZApiError } } },
    ...errorResponses,
  },
})

accommodationsApp.openapi(detailRoute, async (c) => {
  const { slug } = c.req.valid('param')
  try {
    const d = await publicCaller.accommodations.getBySlug({ slug })
    return c.json({ ...d, updated_at: d.updated_at instanceof Date ? d.updated_at.toISOString() : String(d.updated_at) }, 200)
  } catch (error) {
    if (error instanceof TRPCError && error.code === 'NOT_FOUND') {
      return c.json({ error: 'Résidence introuvable.' }, 404)
    }
    throw error
  }
})
