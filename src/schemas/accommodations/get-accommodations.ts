import { z } from 'zod'
import { ZAccomodation } from '~/schemas/accommodations/accommodations'

export const ZGetAccomodationsResponse = z.object({
  count: z.number(),
  next: z.string().nullable(),
  minPrice: z.number().nullable(),
  maxPrice: z.number().nullable(),
  pageSize: z.number(),
  previous: z.string().nullable(),
  results: z.array(ZAccomodation),
})

export type TGetAccomodationsResponse = z.infer<typeof ZGetAccomodationsResponse>
