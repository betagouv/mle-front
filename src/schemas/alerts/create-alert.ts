import { z } from 'zod'

export const ZCreateAlertRequest = z
  .object({
    name: z.string().min(1, "Le nom de l'alerte est requis"),
    cityId: z.number().optional(),
    departmentId: z.number().optional(),
    academyId: z.number().optional(),
    hasColiving: z.boolean(),
    isAccessible: z.boolean(),
    maxPrice: z.number().min(1, 'Le prix maximum doit être supérieur à 0'),
  })
  .refine((data) => data.cityId != null || data.departmentId != null || data.academyId != null, {
    message: 'Veuillez sélectionner un territoire (ville, département ou académie)',
    path: ['cityId'],
  })

export type TCreateAlertRequest = z.infer<typeof ZCreateAlertRequest>
