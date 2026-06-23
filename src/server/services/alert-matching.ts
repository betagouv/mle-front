import { eq, type SQL, sql } from 'drizzle-orm'
import { academies } from '~/server/db/schema/academies'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodations } from '~/server/db/schema/accommodations'
import { cities } from '~/server/db/schema/cities'
import { departments } from '~/server/db/schema/departments'
import { owners } from '~/server/db/schema/owners'

/**
 * Critères d'une alerte étudiant utilisés pour décider quels logements la satisfont.
 * Partagé entre la recherche (compteur d'alertes) et le détecteur d'alertes, afin que
 * les deux appliquent rigoureusement les mêmes conditions de matching.
 */
export type AlertMatchInput = {
  cityId: number | null
  departmentId: number | null
  academyId: number | null
  hasColiving: boolean
  isAccessible: boolean
  maxPrice: number
}

/**
 * Disponibilité totale courante d'une résidence :
 *   - NULL  si tous les compteurs `nb_t*_available` sont NULL (non-renseignée)
 *   - sinon la somme des logements disponibles tous types confondus.
 *
 * Mutualisée : le détecteur (delta vs snapshot) et le flux d'amorçage à la création
 * d'alerte (`dispo > 0`) s'appuient sur exactement la même définition.
 */
export const accommodationAvailableCount = sql<number | null>`
  CASE WHEN ${accommodations.nbT1Available} IS NULL AND ${accommodations.nbT1BisAvailable} IS NULL
        AND ${accommodations.nbT2Available} IS NULL AND ${accommodations.nbT3Available} IS NULL
        AND ${accommodations.nbT4Available} IS NULL AND ${accommodations.nbT5Available} IS NULL
        AND ${accommodations.nbT6Available} IS NULL AND ${accommodations.nbT7MoreAvailable} IS NULL
       THEN NULL
       ELSE (
         coalesce(${accommodations.nbT1Available}, 0) + coalesce(${accommodations.nbT1BisAvailable}, 0) +
         coalesce(${accommodations.nbT2Available}, 0) + coalesce(${accommodations.nbT3Available}, 0) +
         coalesce(${accommodations.nbT4Available}, 0) + coalesce(${accommodations.nbT5Available}, 0) +
         coalesce(${accommodations.nbT6Available}, 0) + coalesce(${accommodations.nbT7MoreAvailable}, 0)
       )::int
  END`

/**
 * Construit la condition d'intersection spatiale pour le niveau de territoire de l'alerte
 * (ville > département > académie, le premier renseigné l'emporte).
 * Retourne `null` si aucun territoire n'est défini (l'alerte couvre alors tout le pays).
 */
export function buildTerritoryCondition(alert: Pick<AlertMatchInput, 'cityId' | 'departmentId' | 'academyId'>): SQL | null {
  const territoryLevels: { id: number | null; table: typeof cities | typeof departments | typeof academies }[] = [
    { id: alert.cityId, table: cities },
    { id: alert.departmentId, table: departments },
    { id: alert.academyId, table: academies },
  ]

  for (const { id, table } of territoryLevels) {
    if (id) {
      return sql`EXISTS (SELECT 1 FROM ${accommodationAddresses} WHERE ${accommodationAddresses.accommodationId} = ${accommodations.id} AND ST_Intersects(${accommodationAddresses.geom}, (SELECT ${table.boundary} FROM ${table} WHERE ${table.id} = ${id})))`
    }
  }
  return null
}

/**
 * Conditions SQL qu'un logement doit remplir pour correspondre à une alerte :
 * publié, prix d'entrée sous le plafond, hors CROUS, et selon les critères coliving /
 * accessibilité / territoire de l'alerte.
 */
export function buildAlertMatchConditions(alert: AlertMatchInput): SQL[] {
  const conditions: SQL[] = [
    eq(accommodations.published, true),
    sql`${accommodations.priceMin} <= ${alert.maxPrice}`,
    sql`(${accommodations.ownerId} IS NULL OR ${accommodations.ownerId} NOT IN (SELECT ${owners.id} FROM ${owners} WHERE ${owners.slug} = 'crous'))`,
  ]

  if (alert.hasColiving) {
    conditions.push(sql`${accommodations.nbColivingApartments} > 0`)
  }
  if (alert.isAccessible) {
    conditions.push(sql`${accommodations.nbAccessibleApartments} > 0`)
  }

  const territory = buildTerritoryCondition(alert)
  if (territory) {
    conditions.push(territory)
  }

  return conditions
}
