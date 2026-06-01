import type { TTypologiesRecord } from '~/schemas/accommodations/accommodations'

/**
 * Total available apartments across typologies. Sums `nbAvailable` over present typologies;
 * returns null when every availability is unknown (null) — i.e. "availability not provided".
 */
export function calculateAvailability(typologies: TTypologiesRecord): number | null {
  const available = Object.values(typologies)
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => t.nbAvailable)
    .filter((v): v is number => v != null)
  return available.length === 0 ? null : available.reduce((sum, v) => sum + v, 0)
}
