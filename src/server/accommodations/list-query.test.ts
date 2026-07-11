import { PgDialect } from 'drizzle-orm/pg-core'
import { describe, expect, it } from 'vitest'
import { resolveLocationConditions } from '~/server/accommodations/list-query'

const render = (condition: ReturnType<typeof resolveLocationConditions>) => {
  if (!condition) return null
  return new PgDialect().sqlToQuery(condition)
}

describe('resolveLocationConditions', () => {
  it('renvoie null quand aucune dimension de localisation', () => {
    expect(resolveLocationConditions({})).toBeNull()
    expect(resolveLocationConditions({ citySlugs: [], postalCodes: [] })).toBeNull()
  })

  it('génère un ST_Within corrélé pour les slugs de villes (lowercased, paramétré)', () => {
    const query = render(resolveLocationConditions({ citySlugs: ['Paris', 'LYON'] }))
    expect(query?.sql).toContain('ST_Within')
    expect(query?.sql).toContain('loc_c.slug')
    expect(query?.params).toContain('paris')
    expect(query?.params).toContain('lyon')
  })

  it('gère département par code OU slug', () => {
    const query = render(resolveLocationConditions({ departments: ['75', 'rhone'] }))
    expect(query?.sql).toContain('loc_d.code')
    expect(query?.sql).toContain('loc_d.slug')
    expect(query?.params).toContain('75')
    expect(query?.params).toContain('rhone')
  })

  it('filtre les codes postaux en attributaire (pas de ST_Within)', () => {
    const query = render(resolveLocationConditions({ postalCodes: ['75001'] }))
    expect(query?.sql).not.toContain('ST_Within')
    expect(query?.params).toContain('75001')
  })

  it('combine plusieurs dimensions en OR', () => {
    const query = render(resolveLocationConditions({ citySlugs: ['paris'], postalCodes: ['69001'] }))
    expect(query?.sql).toContain(' or ')
  })
})
