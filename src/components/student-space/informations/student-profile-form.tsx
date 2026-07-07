'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createToast } from '~/components/ui/createToast'
import { useUpdateStudentProfile } from '~/hooks/use-update-student-profile'
import { type TUpdateStudentProfileForm, ZUpdateStudentProfileForm } from '~/schemas/student/update-profile'
import { authClient } from '~/services/better-auth-client'

type StudentProfileFormProps = {
  initialValues: {
    firstname: string
    lastname: string
    email: string
    phone: string | null
    birthdate: string | null
    scholarshipStatus: 'yes' | 'no' | 'unknown' | null
  }
}

const PASSWORD_HINT = '12 caractères, composé de chiffres, lettres et caractères spéciaux'
const HIDE_PASSWORD = 'Masquer le mot de passe'
const SHOW_PASSWORD = 'Afficher le mot de passe'

export const StudentProfileForm = ({ initialValues }: StudentProfileFormProps) => {
  const { mutate: updateProfile, isPending } = useUpdateStudentProfile()
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TUpdateStudentProfileForm>({
    resolver: zodResolver(ZUpdateStudentProfileForm),
    defaultValues: {
      firstname: initialValues.firstname,
      lastname: initialValues.lastname,
      phone: initialValues.phone ?? '',
      birthdate: initialValues.birthdate ?? '',
      scholarshipStatus: initialValues.scholarshipStatus ?? undefined,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const scholarshipStatus = watch('scholarshipStatus')

  const onSubmit = async (data: TUpdateStudentProfileForm) => {
    if (data.newPassword && data.currentPassword) {
      const result = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: false,
      })
      if (result.error) {
        createToast({ priority: 'error', message: 'Une erreur est survenue, le mot de passe actuel est erroné.' })
        return
      }
    }

    updateProfile({
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone || null,
      birthdate: data.birthdate || null,
      scholarshipStatus: data.scholarshipStatus ?? null,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="fr-flex fr-direction-column fr-flex-gap-4v">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={
              <>
                Nom&nbsp;
                <span className="fr-text--bold" style={{ color: 'red' }}>
                  *
                </span>
              </>
            }
            state={errors.lastname ? 'error' : undefined}
            stateRelatedMessage={errors.lastname?.message}
            nativeInputProps={{ ...register('lastname') }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={
              <>
                Prénom&nbsp;
                <span className="fr-text--bold" style={{ color: 'red' }}>
                  *
                </span>
              </>
            }
            state={errors.firstname ? 'error' : undefined}
            stateRelatedMessage={errors.firstname?.message}
            nativeInputProps={{ ...register('firstname') }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={
              <>
                E-mail&nbsp;
                <span className="fr-text--bold" style={{ color: 'red' }}>
                  *
                </span>
              </>
            }
            disabled
            nativeInputProps={{ value: initialValues.email, readOnly: true }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Téléphone portable"
            state={errors.phone ? 'error' : undefined}
            stateRelatedMessage={errors.phone?.message}
            nativeInputProps={{ ...register('phone'), type: 'tel', placeholder: '0612345678' }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Date de naissance"
            hintText="Format jj/mm/aaaa"
            state={errors.birthdate ? 'error' : undefined}
            stateRelatedMessage={errors.birthdate?.message}
            nativeInputProps={{ ...register('birthdate'), type: 'date' }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6 fr-flex fr-align-items-center">
          <RadioButtons
            legend="Êtes-vous boursier ?"
            name="scholarshipStatus"
            orientation="horizontal"
            options={[
              {
                label: 'Oui',
                nativeInputProps: {
                  value: 'yes',
                  checked: scholarshipStatus === 'yes',
                  onChange: () => setValue('scholarshipStatus', 'yes'),
                },
              },
              {
                label: 'Non',
                nativeInputProps: {
                  value: 'no',
                  checked: scholarshipStatus === 'no',
                  onChange: () => setValue('scholarshipStatus', 'no'),
                },
              },
              {
                label: 'Je ne sais pas',
                nativeInputProps: {
                  value: 'unknown',
                  checked: scholarshipStatus === 'unknown',
                  onChange: () => setValue('scholarshipStatus', 'unknown'),
                },
              },
            ]}
          />
        </div>
      </div>

      <div className="fr-border-top fr-pt-4w fr-mt-2w fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Mot de passe actuel"
            hintText={PASSWORD_HINT}
            state={errors.currentPassword ? 'error' : undefined}
            stateRelatedMessage={errors.currentPassword?.message}
            addon={
              <Button
                iconId={showCurrentPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                priority="tertiary"
                type="button"
                title={showCurrentPassword ? HIDE_PASSWORD : SHOW_PASSWORD}
                nativeButtonProps={{ onClick: () => setShowCurrentPassword((v) => !v) }}
              />
            }
            nativeInputProps={{ ...register('currentPassword'), type: showCurrentPassword ? 'text' : 'password' }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Nouveau mot de passe"
            hintText={PASSWORD_HINT}
            state={errors.newPassword ? 'error' : undefined}
            stateRelatedMessage={errors.newPassword?.message}
            addon={
              <Button
                iconId={showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                priority="tertiary"
                type="button"
                title={showNewPassword ? HIDE_PASSWORD : SHOW_PASSWORD}
                nativeButtonProps={{ onClick: () => setShowNewPassword((v) => !v) }}
              />
            }
            nativeInputProps={{ ...register('newPassword'), type: showNewPassword ? 'text' : 'password' }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label="Confirmation du nouveau mot de passe"
            hintText={PASSWORD_HINT}
            state={errors.confirmPassword ? 'error' : undefined}
            stateRelatedMessage={errors.confirmPassword?.message}
            addon={
              <Button
                iconId={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                priority="tertiary"
                type="button"
                title={showConfirmPassword ? HIDE_PASSWORD : SHOW_PASSWORD}
                nativeButtonProps={{ onClick: () => setShowConfirmPassword((v) => !v) }}
              />
            }
            nativeInputProps={{ ...register('confirmPassword'), type: showConfirmPassword ? 'text' : 'password' }}
          />
        </div>
      </div>

      <div className="fr-flex fr-justify-content-end fr-mt-2w">
        <Button type="submit" disabled={isPending}>
          {isPending ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </form>
  )
}
