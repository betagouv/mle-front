import { eq } from 'drizzle-orm'
import { accommodationTypologies } from '../../server/db/schema/accommodation-typologies'
import { typologiesByType } from '../../server/lib/typologies'
import { getTestDb } from './test-db'

/** Charge les typologies d'une accommodation et les indexe par type (pour les assertions de test). */
export async function loadTypologies(accommodationId: number) {
  return typologiesByType(
    await getTestDb().select().from(accommodationTypologies).where(eq(accommodationTypologies.accommodationId, accommodationId)),
  )
}
