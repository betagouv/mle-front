import { eq } from 'drizzle-orm'
import { accommodations } from '../../server/db/schema/accommodations'
import { typologiesByType } from '../../server/lib/typologies'
import { getTestDb } from './test-db'

/** Charge les typologies d'une accommodation et les indexe par type (pour les assertions de test). */
export async function loadTypologies(accommodationId: number) {
  const row = await getTestDb().query.accommodations.findFirst({
    where: eq(accommodations.id, accommodationId),
    with: { typologies: true },
  })
  return typologiesByType(row?.typologies ?? [])
}
