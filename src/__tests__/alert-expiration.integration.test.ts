import { eq } from 'drizzle-orm'
import { describe, expect, it, vi } from 'vitest'
import { studentAlerts } from '~/server/db/schema'
import { expireStaleAlerts, sendExpiryReminders } from '~/server/services/alert-expiration'
import { DAY_MS } from '~/utils/time'
import { createAlert } from './fixtures/factories'
import './helpers/setup-integration'
import { getTestDb } from './helpers/test-db'

vi.mock('~/server/services/brevo', async () => {
  const actual = await vi.importActual<typeof import('~/server/services/brevo')>('~/server/services/brevo')
  return {
    ...actual,
    sendAlertExpiryReminderEmail: vi.fn().mockResolvedValue(undefined),
    sendAlertDeactivationEmail: vi.fn().mockResolvedValue(undefined),
  }
})

const daysAgo = (n: number) => new Date(Date.now() - n * DAY_MS)

async function getAlert(id: number) {
  const db = getTestDb()
  const [row] = await db.select().from(studentAlerts).where(eq(studentAlerts.id, id))
  return row
}

describe('sendExpiryReminders', () => {
  it('relance une alerte active de plus de 90 jours et marque expiryReminderSentAt', async () => {
    const alert = await createAlert({
      userId: 'exp-user-1',
      name: 'Alerte ancienne',
      maxPrice: 500,
      receiveNotifications: true,
      renewedAt: daysAgo(91),
    })

    const { reminded } = await sendExpiryReminders()
    expect(reminded).toBe(1)

    const updated = await getAlert(alert.id)
    expect(updated.expiryReminderSentAt).not.toBeNull()
    expect(updated.receiveNotifications).toBe(true)
  })

  it("est idempotente : un second passage ne renvoie pas d'email", async () => {
    await createAlert({
      userId: 'exp-user-2',
      name: 'Alerte ancienne',
      maxPrice: 500,
      receiveNotifications: true,
      renewedAt: daysAgo(91),
    })

    expect((await sendExpiryReminders()).reminded).toBe(1)
    expect((await sendExpiryReminders()).reminded).toBe(0)
  })

  it('ignore les alertes de moins de 90 jours', async () => {
    await createAlert({
      userId: 'exp-user-3',
      name: 'Alerte récente',
      maxPrice: 500,
      receiveNotifications: true,
      renewedAt: daysAgo(10),
    })

    expect((await sendExpiryReminders()).reminded).toBe(0)
  })

  it('ignore les alertes sans notifications', async () => {
    await createAlert({
      userId: 'exp-user-4',
      name: 'Alerte éteinte',
      maxPrice: 500,
      receiveNotifications: false,
      renewedAt: daysAgo(91),
    })

    expect((await sendExpiryReminders()).reminded).toBe(0)
  })
})

describe('expireStaleAlerts', () => {
  it('désactive une alerte relancée depuis plus de 7 jours', async () => {
    const alert = await createAlert({
      userId: 'exp-user-5',
      name: 'Alerte à désactiver',
      maxPrice: 500,
      receiveNotifications: true,
      renewedAt: daysAgo(98),
      expiryReminderSentAt: daysAgo(8),
    })

    const { deactivated } = await expireStaleAlerts()
    expect(deactivated).toBe(1)

    const updated = await getAlert(alert.id)
    expect(updated.receiveNotifications).toBe(false)
    expect(updated.expiredAt).not.toBeNull()
  })

  it('ignore les alertes relancées depuis moins de 7 jours', async () => {
    await createAlert({
      userId: 'exp-user-6',
      name: 'Relance récente',
      maxPrice: 500,
      receiveNotifications: true,
      renewedAt: daysAgo(93),
      expiryReminderSentAt: daysAgo(3),
    })

    expect((await expireStaleAlerts()).deactivated).toBe(0)
  })

  it('ignore les alertes jamais relancées', async () => {
    await createAlert({
      userId: 'exp-user-7',
      name: 'Jamais relancée',
      maxPrice: 500,
      receiveNotifications: true,
      renewedAt: daysAgo(30),
    })

    expect((await expireStaleAlerts()).deactivated).toBe(0)
  })
})
