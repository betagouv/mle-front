import { beforeEach, describe, expect, it } from 'vitest'
import { createAcademy, createAlert, createCity, createDepartment, createUser } from './fixtures/factories'
import './helpers/setup-integration'
import { authenticatedCaller, authenticatedCaller2, caller } from './helpers/test-caller'

beforeEach(async () => {
  await createUser({ id: 'test-user-id' })
  await createUser({ id: 'test-user-id-2' })
})

describe('alerts.list', () => {
  it('requires authentication', async () => {
    await expect(caller.alerts.list()).rejects.toThrow('UNAUTHORIZED')
  })

  it('returns alerts of the current user only', async () => {
    await createAlert({ userId: 'test-user-id', name: 'Alert 1', maxPrice: 500 })
    await createAlert({ userId: 'test-user-id', name: 'Alert 2', maxPrice: 600 })
    await createAlert({ userId: 'other-user-id', name: 'Alert Other', maxPrice: 700 })

    const result = await authenticatedCaller.alerts.list()
    expect(result).toHaveLength(2)
    expect(result.map((a) => a.name)).toEqual(expect.arrayContaining(['Alert 1', 'Alert 2']))
  })

  it('returns enriched data with city and bbox', async () => {
    const academy = await createAcademy({
      name: 'Académie de Lyon',
      boundary: {
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [4.0, 45.0],
              [5.0, 45.0],
              [5.0, 46.0],
              [4.0, 46.0],
              [4.0, 45.0],
            ],
          ],
        ],
      },
    })
    const dept = await createDepartment({ academyId: academy.id, name: 'Loire', code: '42' })
    const city = await createCity({ departmentId: dept.id, name: 'Saint-Étienne', slug: 'saint-etienne' })

    await createAlert({ userId: 'test-user-id', name: 'Alert City', maxPrice: 500, cityId: city.id })

    const result = await authenticatedCaller.alerts.list()
    expect(result).toHaveLength(1)
    expect(result[0].city).not.toBeNull()
    expect(result[0].city!.name).toBe('Saint-Étienne')
    expect(result[0].city!.department.code).toBe('42')
    expect(result[0].count).toBe(0)
  })
})

describe('alerts.create', () => {
  it('requires authentication', async () => {
    await expect(caller.alerts.create({ name: 'Test', hasColiving: false, isAccessible: false, maxPrice: 500 })).rejects.toThrow(
      'UNAUTHORIZED',
    )
  })

  // An alert shall have a territory reference
  // otherwise it will send the student every accommodations in the database, filtered by price.
  it('creates an alert', async () => {
    const academy = await createAcademy({ name: 'Académie Test' })
    const dept = await createDepartment({ academyId: academy.id })
    const city = await createCity({ departmentId: dept.id })

    const result = await authenticatedCaller.alerts.create({
      name: 'Mon alerte',
      cityId: city.id,
      hasColiving: true,
      isAccessible: false,
      maxPrice: 600,
    })

    expect(result.name).toBe('Mon alerte')
    expect(result.hasColiving).toBe(true)
    expect(result.maxPrice).toBe(600)

    const alerts = await authenticatedCaller.alerts.list()
    expect(alerts).toHaveLength(1)
    expect(alerts[0].name).toBe('Mon alerte')
  })

  it('creates an alert with territory references', async () => {
    const academy = await createAcademy({ name: 'Académie Test' })
    const dept = await createDepartment({ academyId: academy.id })
    const city = await createCity({ departmentId: dept.id })

    const result = await authenticatedCaller.alerts.create({
      name: 'Alert Territoire',
      cityId: city.id,
      departmentId: dept.id,
      academyId: academy.id,
      hasColiving: false,
      isAccessible: true,
      maxPrice: 800,
    })

    expect(result.cityId).toBe(city.id)
    expect(result.departmentId).toBe(dept.id)
    expect(result.academyId).toBe(academy.id)
  })
})

describe('alerts.update', () => {
  it('requires authentication', async () => {
    await expect(caller.alerts.update({ id: 1, name: 'Updated' })).rejects.toThrow('UNAUTHORIZED')
  })

  it('updates own alert', async () => {
    const alert = await createAlert({ userId: 'test-user-id', name: 'Original', maxPrice: 500 })

    const result = await authenticatedCaller.alerts.update({
      id: alert.id,
      name: 'Updated',
      maxPrice: 700,
    })

    expect(result.name).toBe('Updated')
    expect(result.maxPrice).toBe(700)
  })

  it('partial update works', async () => {
    const alert = await createAlert({
      userId: 'test-user-id',
      name: 'Original',
      maxPrice: 500,
      hasColiving: false,
    })

    const result = await authenticatedCaller.alerts.update({
      id: alert.id,
      hasColiving: true,
    })

    expect(result.name).toBe('Original')
    expect(result.hasColiving).toBe(true)
    expect(result.maxPrice).toBe(500)
  })

  it('cannot update another user alert', async () => {
    const alert = await createAlert({ userId: 'other-user-id', name: 'Other', maxPrice: 500 })

    const result = await authenticatedCaller.alerts.update({
      id: alert.id,
      name: 'Hacked',
    })

    expect(result).toBeUndefined()
  })
})

describe('alerts.delete', () => {
  it('requires authentication', async () => {
    await expect(caller.alerts.delete({ id: 1 })).rejects.toThrow('UNAUTHORIZED')
  })

  it('deletes own alert', async () => {
    const alert = await createAlert({ userId: 'test-user-id', name: 'To Delete', maxPrice: 500 })

    const result = await authenticatedCaller.alerts.delete({ id: alert.id })
    expect(result.success).toBe(true)

    const alerts = await authenticatedCaller.alerts.list()
    expect(alerts).toHaveLength(0)
  })

  it('does not affect other users alerts', async () => {
    await createAlert({ userId: 'test-user-id', name: 'Mine', maxPrice: 500 })
    const otherAlert = await createAlert({ userId: 'test-user-id-2', name: 'Other', maxPrice: 600 })

    await authenticatedCaller.alerts.delete({ id: otherAlert.id })

    const myAlerts = await authenticatedCaller.alerts.list()
    expect(myAlerts).toHaveLength(1)

    const otherAlerts = await authenticatedCaller2.alerts.list()
    expect(otherAlerts).toHaveLength(1)
  })
})
