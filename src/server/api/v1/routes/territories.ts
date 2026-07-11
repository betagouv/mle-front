import { createRoute } from '@hono/zod-openapi'
import {
  ZApiAcademy,
  ZApiCity,
  ZApiDepartment,
  ZApiTerritorySearch,
  ZCitiesQuery,
  ZTerritoryListQuery,
  ZTerritorySearchQuery,
} from '~/schemas/api/v1'
import { createApiHono, errorResponses, publicCaller, security } from '../shared'

export const territoriesApp = createApiHono()

const citiesRoute = createRoute({
  method: 'get',
  path: '/cities',
  tags: ['Territoires'],
  summary: 'Lister les villes',
  description: 'Villes disponibles avec leur slug (utilisable dans le filtre `city_slugs`), statistiques et bbox.',
  security,
  request: { query: ZCitiesQuery },
  responses: {
    200: { description: 'Liste de villes.', content: { 'application/json': { schema: ZApiCity.array() } } },
    ...errorResponses,
  },
})

territoriesApp.openapi(citiesRoute, async (c) => {
  const q = c.req.valid('query')
  const cities = await publicCaller.territories.listCities({ departmentCode: q.department, popular: q.popular, search: q.search })
  return c.json(cities, 200)
})

const departmentsRoute = createRoute({
  method: 'get',
  path: '/departments',
  tags: ['Territoires'],
  summary: 'Lister les départements',
  description: 'Départements (nom, slug, code). Filtrable par recherche textuelle sur le nom.',
  security,
  request: { query: ZTerritoryListQuery },
  responses: {
    200: { description: 'Liste de départements.', content: { 'application/json': { schema: ZApiDepartment.array() } } },
    ...errorResponses,
  },
})

territoriesApp.openapi(departmentsRoute, async (c) => {
  const q = c.req.valid('query')
  const departments = await publicCaller.territories.listDepartments({ search: q.search })
  return c.json(departments, 200)
})

const academiesRoute = createRoute({
  method: 'get',
  path: '/academies',
  tags: ['Territoires'],
  summary: 'Lister les académies',
  description: 'Académies (nom, slug). Filtrable par recherche textuelle sur le nom.',
  security,
  request: { query: ZTerritoryListQuery },
  responses: {
    200: { description: "Liste d'académies.", content: { 'application/json': { schema: ZApiAcademy.array() } } },
    ...errorResponses,
  },
})

territoriesApp.openapi(academiesRoute, async (c) => {
  const q = c.req.valid('query')
  const academies = await publicCaller.territories.listAcademies({ search: q.search })
  return c.json(academies, 200)
})

const territorySearchRoute = createRoute({
  method: 'get',
  path: '/territories/search',
  tags: ['Territoires'],
  summary: 'Rechercher un territoire',
  description: 'Recherche plein-texte sur les villes, départements et académies.',
  security,
  request: { query: ZTerritorySearchQuery },
  responses: {
    200: { description: 'Territoires correspondants.', content: { 'application/json': { schema: ZApiTerritorySearch } } },
    ...errorResponses,
  },
})

territoriesApp.openapi(territorySearchRoute, async (c) => {
  const { q } = c.req.valid('query')
  const result = await publicCaller.territories.search({ q })
  return c.json(result, 200)
})
