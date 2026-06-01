import type { TTypologiesRecord } from '~/schemas/accommodations/accommodations'

export const APARTMENT_TYPES = ['t1', 't1_bis', 't2', 't3', 't4', 't5', 't6', 't7_more'] as const
export type ApartmentType = (typeof APARTMENT_TYPES)[number]

export const APARTMENT_TYPE_LABELS: Record<ApartmentType, string> = {
  t1: 'T1 (Studio)',
  t1_bis: 'T1 bis',
  t2: 'T2',
  t3: 'T3',
  t4: 'T4',
  t5: 'T5',
  t6: 'T6',
  t7_more: 'T7+',
}

/** Apartment types that currently have availability (> 0). */
export function getAvailableApartmentTypes(typologies: TTypologiesRecord): ApartmentType[] {
  return APARTMENT_TYPES.filter((type) => (typologies[type]?.nbAvailable ?? 0) > 0)
}
