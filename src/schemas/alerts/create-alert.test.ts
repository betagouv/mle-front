import { describe, expect, it } from 'vitest'
import { ZCreateAlertRequest } from './create-alert'

const base = { name: 'Mon alerte', hasColiving: false, isAccessible: false, maxPrice: 500 }

describe('ZCreateAlertRequest', () => {
  it('rejette une alerte sans territoire', () => {
    const result = ZCreateAlertRequest.safeParse(base)
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('territoire')
    }
  })

  it('accepte une alerte avec une ville', () => {
    expect(ZCreateAlertRequest.safeParse({ ...base, cityId: 1 }).success).toBe(true)
  })

  it('accepte une alerte avec un département', () => {
    expect(ZCreateAlertRequest.safeParse({ ...base, departmentId: 42 }).success).toBe(true)
  })

  it('accepte une alerte avec une académie', () => {
    expect(ZCreateAlertRequest.safeParse({ ...base, academyId: 7 }).success).toBe(true)
  })
})
