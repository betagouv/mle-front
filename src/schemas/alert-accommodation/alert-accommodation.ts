import { z } from 'zod'

export const ZAlertAccommodationFormSchema = z.object({
  email: z.string().email(),
  territory_name: z.string(),
  territory_type: z.string(),
})

export type TAlertAccommodationForm = z.infer<typeof ZAlertAccommodationFormSchema>
