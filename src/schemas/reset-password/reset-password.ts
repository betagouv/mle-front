import { z } from 'zod'

export const ZResetPasswordForm = z
  .object({
    password: z.string().min(12, { message: 'Votre mot de passe doit contenir au moins 12 caractères' }),
    confirmPassword: z.string().min(12, { message: 'Votre mot de passe doit contenir au moins 12 caractères' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Les mots de passe ne correspondent pas',
  })

export type TResetPasswordForm = z.infer<typeof ZResetPasswordForm>
