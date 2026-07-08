'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { useIsModalOpen } from '@codegouvfr/react-dsfr/Modal/useIsModalOpen'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { StudentProfileFields } from '~/components/student-space/profile/student-profile-fields'
import { createToast } from '~/components/ui/createToast'
import { useDsfrModalIsBound } from '~/hooks/use-dsfr-modal-is-bound'
import { type TStudentProfileInfo, ZStudentProfileInfo } from '~/schemas/student-profile/student-profile'
import { authClient } from '~/services/better-auth-client'

const completeProfileModalId = 'complete-profile-modal'

export const completeProfileModal = createModal({
  id: completeProfileModalId,
  isOpenedByDefault: false,
})

interface Props {
  /** Modale obligatoire : la fermeture est empêchée tant que le profil n'est pas complété. */
  mandatory?: boolean
  /**
   * Ouvre automatiquement la modale au montage. L'appel à `.open()` est fait ICI
   * (et non depuis le parent) car le `Component` DSFR doit être monté/enregistré,
   * sinon `.open()` plante (« Cannot read properties of null (reading 'modal') »).
   */
  autoOpen?: boolean
  /** Valeurs déjà connues (profil partiellement rempli) pour pré-remplir le formulaire. */
  defaultValues?: {
    phone?: string | null
    birthdate?: string | null
    scholarshipStatus?: TStudentProfileInfo['scholarshipStatus'] | null
  }
  /** Appelé après un enregistrement réussi (avant le rafraîchissement de la session). */
  onCompleted?: () => void
}

export const CompleteProfileModal = ({ mandatory = false, autoOpen = false, defaultValues, onCompleted }: Props) => {
  const router = useRouter()
  const [completed, setCompleted] = useState(false)
  const [hasOpened, setHasOpened] = useState(false)
  const [autoOpened, setAutoOpened] = useState(false)
  const isOpen = useIsModalOpen(completeProfileModal)
  const isBound = useDsfrModalIsBound(completeProfileModalId)

  const form = useForm<TStudentProfileInfo>({
    resolver: zodResolver(ZStudentProfileInfo),
    defaultValues: {
      phone: defaultValues?.phone ?? '',
      birthdate: defaultValues?.birthdate ?? '',
      ...(defaultValues?.scholarshipStatus ? { scholarshipStatus: defaultValues.scholarshipStatus } : {}),
    },
  })

  useEffect(() => {
    if (isOpen) setHasOpened(true)
  }, [isOpen])

  // Ouverture automatique (une seule fois), une fois la modale bindée par le JS
  // du DSFR — l'ouvrir avant plante (cf. `useDsfrModalIsBound`).
  useEffect(() => {
    if (autoOpen && isBound && !autoOpened && !completed) {
      setAutoOpened(true)
      completeProfileModal.open()
    }
  }, [autoOpen, isBound, autoOpened, completed])

  // Mode obligatoire : une fois la modale ouverte, on empêche sa fermeture tant que
  // le profil n'est pas complété (on la ré-ouvre si l'utilisateur tente de la fermer).
  // Le garde `hasOpened` évite de forcer l'ouverture avant tout déclenchement.
  useEffect(() => {
    if (mandatory && hasOpened && !isOpen && !completed) {
      completeProfileModal.open()
    }
  }, [mandatory, hasOpened, isOpen, completed])

  const handleSubmit = form.handleSubmit(async (data) => {
    const { error } = await authClient.updateUser({
      phone: data.phone,
      birthdate: data.birthdate,
      scholarshipStatus: data.scholarshipStatus,
    })

    if (error) {
      createToast({ priority: 'error', message: error.message || 'Une erreur est survenue. Veuillez réessayer.' })
      return
    }

    setCompleted(true)
    createToast({ priority: 'success', message: 'Vos informations ont bien été enregistrées.' })
    completeProfileModal.close()
    onCompleted?.()
    router.refresh()
  })

  return (
    <completeProfileModal.Component title={<span className="fr-text--bold">Complétez votre profil</span>}>
      <FormProvider {...form}>
        <form onSubmit={handleSubmit} className="fr-flex fr-direction-column fr-flex-gap-4v">
          <span>Pour finaliser votre compte, merci de renseigner les informations suivantes.</span>
          <StudentProfileFields />
          <div className="fr-flex fr-justify-content-end fr-flex-gap-2v">
            {!mandatory && (
              <Button priority="secondary" type="button" onClick={() => completeProfileModal.close()}>
                Plus tard
              </Button>
            )}
            <Button priority="primary" type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </FormProvider>
    </completeProfileModal.Component>
  )
}
