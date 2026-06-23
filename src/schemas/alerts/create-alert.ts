import { z } from 'zod'

export const ZCreateAlertRequest = z
  .object({
    name: z.string().min(1, "Le nom de l'alerte est requis"),
    city_id: z.number().optional(),
    department_id: z.number().optional(),
    academy_id: z.number().optional(),
    has_coliving: z.boolean(),
    is_accessible: z.boolean(),
    max_price: z.number().min(1, 'Le prix maximum doit être supérieur à 0'),
  })
  .refine((data) => data.city_id != null || data.department_id != null || data.academy_id != null, {
    message: 'Veuillez sélectionner un territoire (ville, département ou académie)',
    path: ['city_id'],
  })

export type TCreateAlertRequest = z.infer<typeof ZCreateAlertRequest>
