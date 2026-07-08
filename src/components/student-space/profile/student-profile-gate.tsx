'use client'

import { CompleteProfileModal } from '~/components/student-space/profile/complete-profile-modal'
import type { TStudentProfileInfo } from '~/schemas/student-profile/student-profile'
import { isStudentProfileComplete } from '~/utils/student-profile'

interface Props {
  user: {
    phone?: string | null
    birthdate?: string | null
    scholarshipStatus?: string | null
  }
}

/**
 * À l'entrée de l'espace étudiant : si le profil est incomplet, ouvre
 * automatiquement la modale de complétion (fermable — simple rappel).
 * L'ouverture est déléguée à la modale (`autoOpen`) : appeler `.open()` ici,
 * avant que le `Component` DSFR soit monté, plante.
 */
export const StudentProfileGate = ({ user }: Props) => {
  if (isStudentProfileComplete(user)) return null

  return (
    <CompleteProfileModal
      autoOpen
      mandatory={false}
      defaultValues={{
        phone: user.phone,
        birthdate: user.birthdate,
        scholarshipStatus: user.scholarshipStatus as TStudentProfileInfo['scholarshipStatus'] | null,
      }}
    />
  )
}
