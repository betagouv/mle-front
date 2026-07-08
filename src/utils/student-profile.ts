/**
 * Informations étudiant minimales requises. Un profil est considéré complet
 * dès que les trois champs sont renseignés (« Je ne sais pas » compte comme
 * une réponse valide pour `scholarshipStatus`).
 */
interface StudentProfileFields {
  phone?: string | null
  birthdate?: string | null
  scholarshipStatus?: string | null
}

export const isStudentProfileComplete = (user: StudentProfileFields | null | undefined): boolean =>
  Boolean(user?.phone && user?.birthdate && user?.scholarshipStatus)
