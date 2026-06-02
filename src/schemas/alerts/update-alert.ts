import { z } from 'zod'

export const ZUpdateAlertRequest = z.object({
  name: z.string().min(1, "Le nom de l'alerte est requis").optional(),
  cityId: z.number().optional(),
  departmentId: z.number().optional(),
  academyId: z.number().optional(),
  hasColiving: z.boolean().optional(),
  isAccessible: z.boolean().optional(),
  maxPrice: z.number().min(1, 'Le prix maximum doit être supérieur à 0').optional(),
  id: z.number(),
  receiveNotifications: z.boolean().optional(),
})

export type TUpdateAlertRequest = z.infer<typeof ZUpdateAlertRequest>
