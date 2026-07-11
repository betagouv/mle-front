import { describe, expect, it } from 'vitest'
import { ZAccommodationsListQuery } from '~/schemas/api/v1'

describe('ZAccommodationsListQuery', () => {
  it('applique les valeurs par défaut', () => {
    const parsed = ZAccommodationsListQuery.parse({})
    expect(parsed.page).toBe(1)
    expect(parsed.page_size).toBe(12)
    expect(parsed.radius).toBe(10)
    expect(parsed.city_slugs).toBeUndefined()
    expect(parsed.crous).toBeUndefined()
  })

  it('découpe les listes CSV en tableaux nettoyés', () => {
    const parsed = ZAccommodationsListQuery.parse({ city_slugs: 'paris, ,lyon ', postal_codes: '75001,69001' })
    expect(parsed.city_slugs).toEqual(['paris', 'lyon'])
    expect(parsed.postal_codes).toEqual(['75001', '69001'])
  })

  it('parse les booléens de façon robuste', () => {
    expect(ZAccommodationsListQuery.parse({ crous: 'true' }).crous).toBe(true)
    expect(ZAccommodationsListQuery.parse({ crous: 'false' }).crous).toBe(false)
    expect(ZAccommodationsListQuery.parse({}).crous).toBeUndefined()
  })

  it('coerce et borne la pagination', () => {
    expect(ZAccommodationsListQuery.parse({ page: '3', page_size: '50' }).page_size).toBe(50)
    expect(ZAccommodationsListQuery.safeParse({ page_size: '500' }).success).toBe(false)
    expect(ZAccommodationsListQuery.safeParse({ page: '0' }).success).toBe(false)
  })
})
