import { z } from 'zod'

export const ZSignUpForm = z.object({
  firstname: z.string().min(1, { message: 'Veuillez saisir votre prénom' }),
  lastname: z.string().min(1, { message: 'Veuillez saisir votre nom' }),
  email: z.string().min(1, { message: 'Veuillez saisir votre email' }).email({ message: 'Veuillez saisir un email valide' }),
  password: z
    .string()
    .min(12, { message: 'Votre mot de passe doit contenir au moins 12 caractères, composé de chiffres, lettres et caractères spéciaux.' }),
})

export type TSignUpForm = z.infer<typeof ZSignUpForm>
