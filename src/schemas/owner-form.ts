import { z } from 'zod'
import { ZOwnerContactMode } from '~/enums/owner-contact-mode'

export const ZOwnerFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  url: z.url('URL invalide').or(z.literal('')).optional(),
  landingUrl: z.url('URL invalide').or(z.literal('')).optional(),
  contactMode: ZOwnerContactMode,
})

export type TOwnerFormData = z.infer<typeof ZOwnerFormSchema>

export const ZUpdateOwnerInput = ZOwnerFormSchema.partial().extend({ id: z.number() })
export type TUpdateOwnerInput = z.infer<typeof ZUpdateOwnerInput>
