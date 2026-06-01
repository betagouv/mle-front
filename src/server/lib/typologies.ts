import { eq } from 'drizzle-orm'
import { TYPOLOGIES, type TypologyType } from '~/schemas/accommodations/typology'
import { db } from '~/server/db'
import { accommodationTypologies } from '~/server/db/schema/accommodation-typologies'
import { accommodations } from '~/server/db/schema/accommodations'
import { isPerPersonTypology } from '~/utils/is-per-person-typology'

type Database = typeof db
type Transaction = Parameters<Parameters<Database['transaction']>[0]>[0]
type DbOrTx = Database | Transaction

type TypologyRow = typeof accommodationTypologies.$inferSelect

/** Value of the keyed `typologies` object exposed in API responses (camelCase, like ZTypologyView). */
export type TTypologyView = {
  priceMin: number | null
  priceMax: number | null
  superficieMin: number | null
  superficieMax: number | null
  nbTotal: number | null
  nbAvailable: number | null
  colocation: boolean
}

/** Build the keyed `typologies` object from child rows, indexed by the typology type (= suffix). */
export function typologiesByType(rows: TypologyRow[]): Partial<Record<TypologyType, TTypologyView>> {
  const out: Partial<Record<TypologyType, TTypologyView>> = {}
  for (const r of rows) {
    out[r.type] = {
      priceMin: r.priceMin,
      priceMax: r.priceMax,
      superficieMin: r.superficieMin,
      superficieMax: r.superficieMax,
      nbTotal: r.nbTotal,
      nbAvailable: r.nbAvailable,
      colocation: r.colocation,
    }
  }
  return out
}

/** Parent aggregates derived from a set of typologies (denormalized on `accommodation`). */
export type TypologyAggregates = {
  nbTotalApartments: number | null
  priceMin: number | null
  priceMax: number | null
  nbAvailableApartments: number | null
}

type AggregateInput = {
  priceMin?: number | null
  priceMax?: number | null
  nbTotal?: number | null
  nbAvailable?: number | null
}

/**
 * Pure aggregate computation from a typology array. `nbAvailableApartments` stays null when every
 * availability is null, so the search ordering keeps "unknown availability" distinct from "0 available".
 */
export function typologyAggregates(typologies: AggregateInput[]): TypologyAggregates {
  const totals = typologies.map((t) => t.nbTotal).filter((v): v is number => v != null)
  const mins = typologies.map((t) => t.priceMin).filter((v): v is number => v != null && v > 0)
  const maxs = typologies.map((t) => t.priceMax).filter((v): v is number => v != null && v > 0)
  const avails = typologies.map((t) => t.nbAvailable).filter((v): v is number => v != null)

  return {
    nbTotalApartments: totals.length > 0 ? totals.reduce((a, b) => a + b, 0) : null,
    priceMin: mins.length > 0 ? Math.min(...mins) : null,
    priceMax: maxs.length > 0 ? Math.max(...maxs) : null,
    nbAvailableApartments: avails.length > 0 ? avails.reduce((a, b) => a + b, 0) : null,
  }
}

// A typology to persist. Numeric fields are nullable so "unknown" values (e.g. null availability)
// are preserved as NULL. The domain TTypology (strict numbers) is assignable to this.
export type TypologyDraft = {
  type: TypologyType
  priceMin: number | null
  priceMax: number | null
  superficieMin: number | null
  superficieMax: number | null
  nbTotal: number | null
  nbAvailable: number | null
  colocation: boolean
}

function toRow(accommodationId: number, t: TypologyDraft): typeof accommodationTypologies.$inferInsert {
  return {
    accommodationId,
    type: t.type,
    priceMin: t.priceMin,
    priceMax: t.priceMax,
    superficieMin: t.superficieMin,
    superficieMax: t.superficieMax,
    nbTotal: t.nbTotal,
    nbAvailable: t.nbAvailable,
    colocation: t.colocation,
  }
}

/** Replace all typology rows of an accommodation (delete-then-insert). */
export async function persistTypologies(tx: DbOrTx, accommodationId: number, typologies: TypologyDraft[]): Promise<void> {
  await tx.delete(accommodationTypologies).where(eq(accommodationTypologies.accommodationId, accommodationId))
  if (typologies.length === 0) return
  await tx.insert(accommodationTypologies).values(typologies.map((t) => toRow(accommodationId, t)))
}

// ---------------------------------------------------------------------------
// Importer bridge: external sources (CSV/CROUS/…) and test fixtures build a flat camelCase object
// (nbT1, priceMinT1, …). These helpers convert that to typology drafts. This flat↔camel conversion
// is intentionally confined to ingestion — the response/domain layer uses the keyed `typologies`.
// ---------------------------------------------------------------------------

// Typology type (= suffix) -> PascalCase suffix used by the legacy flat camelCase columns.
const TYPE_TO_CAMEL: Record<TypologyType, string> = {
  t1: 'T1',
  t1_bis: 'T1Bis',
  t2: 'T2',
  t3: 'T3',
  t4: 'T4',
  t5: 'T5',
  t6: 'T6',
  t7_more: 'T7More',
}

function camelFlatToTypologyDrafts(flat: Record<string, unknown>): TypologyDraft[] {
  const num = (v: unknown): number | null => (typeof v === 'number' ? v : null)
  const result: TypologyDraft[] = []
  for (const { type } of TYPOLOGIES) {
    const c = TYPE_TO_CAMEL[type]
    const nbTotal = num(flat[`nb${c}`])
    const nbAvailable = num(flat[`nb${c}Available`])
    const priceMin = num(flat[`priceMin${c}`])
    const priceMax = num(flat[`priceMax${c}`])
    const superficieMin = num(flat[`superficieMin${c}`])
    const superficieMax = num(flat[`superficieMax${c}`])
    if (![nbTotal, nbAvailable, priceMin, priceMax, superficieMin, superficieMax].some((v) => v != null)) continue
    result.push({
      type,
      nbTotal,
      nbAvailable,
      priceMin,
      priceMax,
      superficieMin,
      superficieMax,
      colocation: isPerPersonTypology(type),
    })
  }
  return result
}

/**
 * The legacy flat per-typology camelCase keys (nbT1, nbT1Available, priceMinT1, superficieMaxT7More, …).
 * The underlying columns are dropped (migration 0039); importers build these keys in-memory only to
 * feed the typology child rows via the bridge, so they must be stripped before any accommodation
 * insert/update. Keep in sync with camelFlatToTypologyDrafts.
 */
export const FLAT_TYPOLOGY_CAMEL_KEYS: readonly string[] = TYPOLOGIES.flatMap(({ type }) => {
  const c = TYPE_TO_CAMEL[type]
  return [`nb${c}`, `nb${c}Available`, `priceMin${c}`, `priceMax${c}`, `superficieMin${c}`, `superficieMax${c}`]
})

const FLAT_TYPOLOGY_CAMEL_KEY_SET = new Set(FLAT_TYPOLOGY_CAMEL_KEYS)

/** Return a shallow copy of an accommodation insert/update payload without the legacy flat typology keys. */
export function omitFlatTypologyFields<T extends Record<string, unknown>>(obj: T): T {
  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj)) {
    if (!FLAT_TYPOLOGY_CAMEL_KEY_SET.has(key)) result[key] = value
  }
  return result as T
}

/** Importer bridge: derive typology rows from a flat camelCase object, persist, refresh aggregates. */
export async function syncTypologiesFromFlat(tx: DbOrTx, accommodationId: number, flat: Record<string, unknown>): Promise<void> {
  await persistTypologies(tx, accommodationId, camelFlatToTypologyDrafts(flat))
  await recomputeAndPersistAggregates(tx, accommodationId)
}

/** Like syncTypologiesFromFlat but MERGES onto current rows (partial importers, e.g. ARPEJ). */
export async function mergeTypologiesFromFlat(tx: DbOrTx, accommodationId: number, flatOverrides: Record<string, unknown>): Promise<void> {
  const current = await tx.select().from(accommodationTypologies).where(eq(accommodationTypologies.accommodationId, accommodationId))
  const currentFlat: Record<string, unknown> = {}
  for (const r of current) {
    const c = TYPE_TO_CAMEL[r.type]
    currentFlat[`nb${c}`] = r.nbTotal
    currentFlat[`nb${c}Available`] = r.nbAvailable
    currentFlat[`priceMin${c}`] = r.priceMin
    currentFlat[`priceMax${c}`] = r.priceMax
    currentFlat[`superficieMin${c}`] = r.superficieMin
    currentFlat[`superficieMax${c}`] = r.superficieMax
  }
  await persistTypologies(tx, accommodationId, camelFlatToTypologyDrafts({ ...currentFlat, ...flatOverrides }))
  await recomputeAndPersistAggregates(tx, accommodationId)
}

/**
 * Recompute the denormalized parent aggregates from the current child rows and persist them.
 * Reads the rows from the DB so it is correct after partial updates (e.g. availability-only edits).
 * Does NOT touch nbColivingApartments / nbAccessibleApartments — those are caller-set, not derived here.
 */
export async function recomputeAndPersistAggregates(tx: DbOrTx, accommodationId: number): Promise<void> {
  const rows = await tx
    .select({
      priceMin: accommodationTypologies.priceMin,
      priceMax: accommodationTypologies.priceMax,
      nbTotal: accommodationTypologies.nbTotal,
      nbAvailable: accommodationTypologies.nbAvailable,
    })
    .from(accommodationTypologies)
    .where(eq(accommodationTypologies.accommodationId, accommodationId))

  const { nbTotalApartments, priceMin, priceMax, nbAvailableApartments } = typologyAggregates(rows)
  await tx
    .update(accommodations)
    .set({ nbTotalApartments, priceMin, priceMax, nbAvailableApartments })
    .where(eq(accommodations.id, accommodationId))
}
