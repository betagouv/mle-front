const DIFF_IGNORE = new Set(['updatedAt', 'geom', 'cityId', 'city'])

export type DiffEntry = { old: unknown; new: unknown }
export type Diff = Record<string, DiffEntry>

export function computeDiff(
  snapshot: Record<string, unknown>,
  updatedFields: Record<string, unknown>,
  userProvidedKeys: Set<string>,
): Diff {
  const diff: Diff = {}
  for (const key of userProvidedKeys) {
    if (DIFF_IGNORE.has(key)) continue
    const oldVal = snapshot[key]
    const newVal = updatedFields[key]
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diff[key] = { old: oldVal, new: newVal }
    }
  }
  return diff
}

export type ActivityAction =
  | 'accommodation.updated'
  | 'accommodation.published'
  | 'accommodation.unpublished'
  // Emitted directly by bailleur.updateAvailability (availability lives in the typology child table,
  // so it never appears in a bailleur.update field diff).
  | 'accommodation.availability_updated'

export function classifyActions(diff: Diff): { action: ActivityAction; diff: Diff }[] {
  if (Object.keys(diff).length === 0) return []

  const publishedDiff: Diff = {}
  const otherDiff: Diff = {}

  for (const [key, value] of Object.entries(diff)) {
    if (key === 'published') {
      publishedDiff[key] = value
    } else {
      otherDiff[key] = value
    }
  }

  const actions: { action: ActivityAction; diff: Diff }[] = []

  if (Object.keys(publishedDiff).length > 0) {
    const action = publishedDiff.published.new ? 'accommodation.published' : 'accommodation.unpublished'
    actions.push({ action, diff: publishedDiff })
  }

  if (Object.keys(otherDiff).length > 0) {
    actions.push({ action: 'accommodation.updated', diff: otherDiff })
  }

  return actions
}
