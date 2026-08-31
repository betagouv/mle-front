'use client'

import { CompleteProfileModal } from '~/components/student-space/profile/complete-profile-modal'
import { isStudentProfileComplete } from '~/utils/student-profile'

interface Props {
  user: {
    phone?: string | null
    birthdate?: string | null
    scholarshipStatus?: string | null
  }
}

export const StudentProfileGate = ({ user }: Props) => {
  if (isStudentProfileComplete(user)) return null

  return <CompleteProfileModal autoOpen mandatory={false} />
}
