import { eq } from 'drizzle-orm'
import { describe, expect, it } from 'vitest'
import { createAccommodation } from '../../__tests__/fixtures/factories'
import { getTestDb } from '../../__tests__/helpers/test-db'
import { accommodationTypologies } from '../db/schema/accommodation-typologies'
import { accommodations } from '../db/schema/accommodations'
import { mergeTypologies, syncTypologies, typologiesByType, typologyDraft } from './typologies'

const db = () => getTestDb()

async function loadByType(accommodationId: number) {
  return typologiesByType(
    await db().select().from(accommodationTypologies).where(eq(accommodationTypologies.accommodationId, accommodationId)),
  )
}

async function aggregatesOf(accommodationId: number) {
  const [row] = await db().select().from(accommodations).where(eq(accommodations.id, accommodationId))
  return row
}

describe('syncTypologies', () => {
  it('persists the drafts as child rows and recomputes parent aggregates', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [
      typologyDraft('t1', { nbTotal: 10, nbAvailable: 4, priceMin: 400, priceMax: 600 }),
      typologyDraft('t2', { nbTotal: 5, nbAvailable: 1, priceMin: 500, priceMax: 700 }),
    ])

    const typos = await loadByType(acc.id)
    expect(typos.t1?.nbTotal).toBe(10)
    expect(typos.t2?.priceMax).toBe(700)

    const agg = await aggregatesOf(acc.id)
    expect(agg.nbTotalApartments).toBe(15)
    expect(agg.priceMin).toBe(400)
    expect(agg.priceMax).toBe(700)
    expect(agg.nbAvailableApartments).toBe(5)
  })

  it('fully replaces the previous typologies (delete-then-insert)', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [typologyDraft('t1', { nbTotal: 10 }), typologyDraft('t2', { nbTotal: 5 })])
    await syncTypologies(db(), acc.id, [typologyDraft('t3', { nbTotal: 3, priceMin: 800, priceMax: 900 })])

    const typos = await loadByType(acc.id)
    expect(typos.t1).toBeUndefined()
    expect(typos.t2).toBeUndefined()
    expect(typos.t3?.nbTotal).toBe(3)

    const agg = await aggregatesOf(acc.id)
    expect(agg.nbTotalApartments).toBe(3)
    expect(agg.priceMin).toBe(800)
  })

  it('skips all-null drafts (no empty child row is created)', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [typologyDraft('t1', { nbTotal: 10 }), typologyDraft('t2')])

    const typos = await loadByType(acc.id)
    expect(typos.t1).toBeDefined()
    expect(typos.t2).toBeUndefined()
  })
})

describe('mergeTypologies', () => {
  it('overwrites only the provided fields, preserving untouched dimensions', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [
      typologyDraft('t1', { nbTotal: 10, nbAvailable: 4, priceMin: 400, priceMax: 600, superficieMin: 15, superficieMax: 25 }),
    ])

    // price-only patch: counts and surfaces must be preserved
    await mergeTypologies(db(), acc.id, [{ type: 't1', priceMin: 500, priceMax: 700 }])
    let t1 = (await loadByType(acc.id)).t1
    expect(t1?.priceMin).toBe(500)
    expect(t1?.priceMax).toBe(700)
    expect(t1?.nbTotal).toBe(10)
    expect(t1?.superficieMin).toBe(15)
    expect((await aggregatesOf(acc.id)).priceMin).toBe(500)

    // count-only patch: prices preserved
    await mergeTypologies(db(), acc.id, [{ type: 't1', nbTotal: 20 }])
    t1 = (await loadByType(acc.id)).t1
    expect(t1?.nbTotal).toBe(20)
    expect(t1?.priceMin).toBe(500)
    expect((await aggregatesOf(acc.id)).nbTotalApartments).toBe(20)
  })

  it('leaves types absent from the patch untouched and creates new types', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [
      typologyDraft('t1', { nbTotal: 10, priceMin: 400, priceMax: 600 }),
      typologyDraft('t2', { nbTotal: 5 }),
    ])

    await mergeTypologies(db(), acc.id, [
      { type: 't1', priceMin: 450 },
      { type: 't3', nbTotal: 2, priceMin: 900, priceMax: 1000 },
    ])

    const typos = await loadByType(acc.id)
    expect(typos.t1?.priceMin).toBe(450)
    expect(typos.t2?.nbTotal).toBe(5) // untouched
    expect(typos.t3?.nbTotal).toBe(2) // created
  })

  it('overwrites with an explicit null (distinct from an omitted field)', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [typologyDraft('t1', { nbTotal: 10, priceMin: 400, priceMax: 600 })])

    await mergeTypologies(db(), acc.id, [{ type: 't1', priceMin: null }])
    const t1 = (await loadByType(acc.id)).t1
    expect(t1?.priceMin).toBeNull()
    expect(t1?.nbTotal).toBe(10) // omitted → preserved
  })

  it('drops a row that becomes all-null after the merge', async () => {
    const acc = await createAccommodation()
    await syncTypologies(db(), acc.id, [typologyDraft('t1', { nbTotal: 10 })])

    await mergeTypologies(db(), acc.id, [{ type: 't1', nbTotal: null }])
    expect((await loadByType(acc.id)).t1).toBeUndefined()
    expect((await aggregatesOf(acc.id)).nbTotalApartments).toBeNull()
  })
})
