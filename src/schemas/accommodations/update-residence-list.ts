import { z } from 'zod'
import { getTypologyLabel, TYPOLOGY_TYPES, type TypologyType } from './typology'

export const ZAvailabilityEntry = z.object({
  type: z.enum(TYPOLOGY_TYPES),
  nbAvailable: z.number({ message: 'Le champs est requis' }).min(0).nullable(),
})

export const ZUpdateResidenceList = z.object({
  availability: z.array(ZAvailabilityEntry),
})

export type TUpdateResidenceList = z.infer<typeof ZUpdateResidenceList>

/** Validate availability against the existing per-type totals (available ≤ total). */
export const createUpdateResidenceListSchema = (existingTotals: Partial<Record<TypologyType, number | null>>) =>
  ZUpdateResidenceList.superRefine((data, ctx) => {
    data.availability.forEach((entry, i) => {
      const total = existingTotals[entry.type]
      if (total == null && typeof entry.nbAvailable === 'number') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Veuillez d'abord renseigner le nombre total de logements ${getTypologyLabel(entry.type)}`,
          path: ['availability', i, 'nbAvailable'],
        })
      }
      if (total != null && entry.nbAvailable != null && entry.nbAvailable > total) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Le nombre de logements ${getTypologyLabel(entry.type)} disponibles ne peut pas être supérieur au nombre total (${total})`,
          path: ['availability', i, 'nbAvailable'],
        })
      }
    })
  })
