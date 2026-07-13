import { z } from 'zod'

export const ZUpdateStudentProfileInput = z.object({
  firstname: z
    .string()
    .min(1, { message: 'Veuillez saisir votre prénom' })
    .regex(/^[a-zA-ZÀ-ÿ\s\-]+$/, { message: 'Ce champ ne peut contenir que des lettres' }),
  lastname: z
    .string()
    .min(1, { message: 'Veuillez saisir votre nom' })
    .regex(/^[a-zA-ZÀ-ÿ\s\-]+$/, { message: 'Ce champ ne peut contenir que des lettres' }),
  phone: z
    .string()
    .regex(/^0[1-9][0-9]{8}$/, { message: 'Veuillez saisir un numéro de téléphone valide (ex : 0612345678)' })
    .or(z.literal(''))
    .nullable()
    .optional(),
  birthdate: z.string().nullable().optional(),
  scholarshipStatus: z.enum(['yes', 'no', 'unknown']).nullable().optional(),
})

export type TUpdateStudentProfileInput = z.infer<typeof ZUpdateStudentProfileInput>

export const ZUpdateStudentProfileForm = ZUpdateStudentProfileInput.extend({
  currentPassword: z.string().optional(),
  newPassword: z.string().optional(),
  confirmPassword: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.newPassword) return

  if (!data.currentPassword) {
    ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Veuillez saisir votre mot de passe actuel' })
  }
  if (data.newPassword.length < 12) {
    ctx.addIssue({
      code: 'custom',
      path: ['newPassword'],
      message: '12 caractères minimum, composé de chiffres, lettres et caractères spéciaux',
    })
  }
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Les mots de passe ne correspondent pas' })
  }
})

export type TUpdateStudentProfileForm = z.infer<typeof ZUpdateStudentProfileForm>
