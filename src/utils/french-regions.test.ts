import { describe, expect, it } from 'vitest'
import { getRegionByDepartmentCode } from './french-regions'

describe('getRegionByDepartmentCode', () => {
  it('mappe les codes métropolitains vers leur région', () => {
    expect(getRegionByDepartmentCode('75')).toBe('Île-de-France')
    expect(getRegionByDepartmentCode('69')).toBe('Auvergne-Rhône-Alpes')
    expect(getRegionByDepartmentCode('33')).toBe('Nouvelle-Aquitaine')
    expect(getRegionByDepartmentCode('06')).toBe("Provence-Alpes-Côte d'Azur")
  })

  it('gère la Corse (2A / 2B)', () => {
    expect(getRegionByDepartmentCode('2A')).toBe('Corse')
    expect(getRegionByDepartmentCode('2B')).toBe('Corse')
  })

  it('gère les DROM', () => {
    expect(getRegionByDepartmentCode('971')).toBe('Guadeloupe')
    expect(getRegionByDepartmentCode('974')).toBe('La Réunion')
    expect(getRegionByDepartmentCode('976')).toBe('Mayotte')
  })

  it('retourne null pour un code inconnu', () => {
    expect(getRegionByDepartmentCode('99')).toBeNull()
    expect(getRegionByDepartmentCode('000')).toBeNull()
  })

  it('retourne null pour une valeur absente', () => {
    expect(getRegionByDepartmentCode(null)).toBeNull()
    expect(getRegionByDepartmentCode(undefined)).toBeNull()
    expect(getRegionByDepartmentCode('')).toBeNull()
  })
})
