import { z } from 'zod'

/**
 * Calcule l'âge (en années) à partir d'une date ISO `YYYY-MM-DD`.
 */
const computeAge = (isoDate: string): number => {
  const today = new Date()
  const birth = new Date(isoDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1
  }
  return age
}

/**
 * Numéro de téléphone portable — validation internationale permissive.
 * Normalise (retire espaces, points, tirets, parenthèses) puis vérifie un
 * format E.164-like : `+` optionnel suivi de 6 à 15 chiffres.
 * La valeur retournée après parsing est normalisée (ex. `0601020304`).
 */
export const ZStudentPhone = z
  .string()
  .trim()
  .min(1, { message: 'Veuillez saisir votre numéro de téléphone portable' })
  .transform((val) => val.replace(/[\s.\-()]/g, ''))
  .refine((val) => /^\+?\d{6,15}$/.test(val), { message: 'Veuillez saisir un numéro de téléphone valide' })

/**
 * Date de naissance — chaîne `YYYY-MM-DD` (valeur native d'un `<input type="date">`).
 * Vérifie le format, une date réelle, dans le passé, et un âge plausible (15–100 ans).
 */
export const ZBirthDate = z
  .string()
  .min(1, { message: 'Veuillez saisir votre date de naissance' })
  .refine((val) => /^\d{4}-\d{2}-\d{2}$/.test(val), { message: 'Veuillez saisir une date au format jj/mm/aaaa' })
  .refine((val) => !Number.isNaN(new Date(val).getTime()), { message: 'Veuillez saisir une date valide' })
  .refine((val) => new Date(val) < new Date(), { message: 'La date de naissance doit être dans le passé' })
  .refine((val) => computeAge(val) >= 15, { message: 'Vous devez avoir au moins 15 ans' })
  .refine((val) => computeAge(val) <= 100, { message: 'Veuillez saisir une date de naissance valide' })

/**
 * Statut boursier. « Je ne sais pas » (`unknown`) est une réponse valide.
 */
export const ZScholarshipStatus = z.enum(['yes', 'no', 'unknown'], { error: 'Veuillez indiquer si vous êtes boursier' })

/**
 * Bloc d'informations étudiant partagé entre l'inscription et la modale de complétion.
 */
export const ZStudentProfileInfo = z.object({
  phone: ZStudentPhone,
  birthdate: ZBirthDate,
  scholarshipStatus: ZScholarshipStatus,
})

export type TStudentProfileInfo = z.infer<typeof ZStudentProfileInfo>
