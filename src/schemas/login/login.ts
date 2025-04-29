import { z } from 'zod'

export const ZLoginForm = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export type TLoginForm = z.infer<typeof ZLoginForm>
