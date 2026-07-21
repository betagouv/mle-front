'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import Select from '@codegouvfr/react-dsfr/Select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { RequiredLabel } from '~/components/helps-simulator/required-label'
import { createToast } from '~/components/ui/createToast'
import { useUpdateStudentProfile } from '~/hooks/use-update-student-profile'
import { SCHOLARSHIP_TYPES, type TUpdateStudentProfileForm, ZUpdateStudentProfileForm } from '~/schemas/student/update-profile'
import { authClient } from '~/services/better-auth-client'

type StudentProfileFormProps = {
  initialValues: {
    firstname: string
    lastname: string
    email: string
    phone: string | null
    birthdate: string | null
    scholarshipStatus: 'yes' | 'no' | 'unknown' | null
    scholarshipType: (typeof SCHOLARSHIP_TYPES)[number] | null
  }
}

export const StudentProfileForm = ({ initialValues }: StudentProfileFormProps) => {
  const t = useTranslations('student.personalInformations.form')
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
      scholarshipType: initialValues.scholarshipType ?? undefined,
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
        createToast({ priority: 'error', message: t('passwordError') })
        return
      }
    }

    updateProfile({
      firstname: data.firstname,
      lastname: data.lastname,
      phone: data.phone || null,
      birthdate: data.birthdate || null,
      scholarshipStatus: data.scholarshipStatus ?? null,
      scholarshipType: data.scholarshipStatus === 'yes' ? (data.scholarshipType ?? null) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="fr-flex fr-direction-column fr-flex-gap-4v">
      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={<RequiredLabel>{t('lastname')}</RequiredLabel>}
            state={errors.lastname ? 'error' : undefined}
            stateRelatedMessage={errors.lastname?.message}
            nativeInputProps={{ ...register('lastname') }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={<RequiredLabel>{t('firstname')}</RequiredLabel>}
            state={errors.firstname ? 'error' : undefined}
            stateRelatedMessage={errors.firstname?.message}
            nativeInputProps={{ ...register('firstname') }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={<RequiredLabel>{t('email')}</RequiredLabel>}
            disabled
            nativeInputProps={{ value: initialValues.email, readOnly: true }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={t('phone')}
            state={errors.phone ? 'error' : undefined}
            stateRelatedMessage={errors.phone?.message}
            nativeInputProps={{
              ...register('phone', {
                onChange: (e) => {
                  e.target.value = e.target.value.replace(/\D/g, '')
                },
              }),
              type: 'tel',
              placeholder: t('phonePlaceholder'),
              maxLength: 10,
            }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={t('birthdate')}
            hintText={t('birthdateHint')}
            state={errors.birthdate ? 'error' : undefined}
            stateRelatedMessage={errors.birthdate?.message}
            nativeInputProps={{ ...register('birthdate'), type: 'date' }}
          />
        </div>
      </div>

      <div className="fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6 fr-flex fr-align-items-center">
          <RadioButtons
            legend={t('scholarshipQuestion')}
            name="scholarshipStatus"
            orientation="horizontal"
            options={[
              {
                label: t('scholarshipYes'),
                nativeInputProps: {
                  value: 'yes',
                  checked: scholarshipStatus === 'yes',
                  onChange: () => setValue('scholarshipStatus', 'yes'),
                },
              },
              {
                label: t('scholarshipNo'),
                nativeInputProps: {
                  value: 'no',
                  checked: scholarshipStatus === 'no',
                  onChange: () => {
                    setValue('scholarshipStatus', 'no')
                    setValue('scholarshipType', undefined)
                  },
                },
              },
              {
                label: t('scholarshipUnknown'),
                nativeInputProps: {
                  value: 'unknown',
                  checked: scholarshipStatus === 'unknown',
                  onChange: () => {
                    setValue('scholarshipStatus', 'unknown')
                    setValue('scholarshipType', undefined)
                  },
                },
              },
            ]}
          />
        </div>
        {scholarshipStatus === 'yes' && (
          <div className="fr-col-12 fr-col-md-6">
            <Select
              label={t('scholarshipType')}
              state={errors.scholarshipType ? 'error' : undefined}
              stateRelatedMessage={errors.scholarshipType?.message}
              nativeSelectProps={register('scholarshipType', { setValueAs: (value) => value || null })}
            >
              <option value="">{t('scholarshipTypePlaceholder')}</option>
              {SCHOLARSHIP_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`scholarshipTypes.${type}`)}
                </option>
              ))}
            </Select>
          </div>
        )}
      </div>

      <div className="fr-border-top fr-pt-4w fr-mt-2w fr-grid-row fr-grid-row--gutters">
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={t('currentPassword')}
            hintText={t('passwordHint')}
            state={errors.currentPassword ? 'error' : undefined}
            stateRelatedMessage={errors.currentPassword?.message}
            addon={
              <Button
                iconId={showCurrentPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                priority="tertiary"
                type="button"
                title={showCurrentPassword ? t('hidePassword') : t('showPassword')}
                nativeButtonProps={{ onClick: () => setShowCurrentPassword((v) => !v) }}
              />
            }
            nativeInputProps={{ ...register('currentPassword'), type: showCurrentPassword ? 'text' : 'password' }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={t('newPassword')}
            hintText={t('passwordHint')}
            state={errors.newPassword ? 'error' : undefined}
            stateRelatedMessage={errors.newPassword?.message}
            addon={
              <Button
                iconId={showNewPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                priority="tertiary"
                type="button"
                title={showNewPassword ? t('hidePassword') : t('showPassword')}
                nativeButtonProps={{ onClick: () => setShowNewPassword((v) => !v) }}
              />
            }
            nativeInputProps={{ ...register('newPassword'), type: showNewPassword ? 'text' : 'password' }}
          />
        </div>
        <div className="fr-col-12 fr-col-md-6">
          <Input
            label={t('confirmPassword')}
            hintText={t('passwordHint')}
            state={errors.confirmPassword ? 'error' : undefined}
            stateRelatedMessage={errors.confirmPassword?.message}
            addon={
              <Button
                iconId={showConfirmPassword ? 'ri-eye-off-line' : 'ri-eye-line'}
                priority="tertiary"
                type="button"
                title={showConfirmPassword ? t('hidePassword') : t('showPassword')}
                nativeButtonProps={{ onClick: () => setShowConfirmPassword((v) => !v) }}
              />
            }
            nativeInputProps={{ ...register('confirmPassword'), type: showConfirmPassword ? 'text' : 'password' }}
          />
        </div>
      </div>

      <div className="fr-flex fr-justify-content-end fr-mt-2w">
        <Button type="submit" disabled={isPending}>
          {isPending ? t('submitting') : t('submit')}
        </Button>
      </div>
    </form>
  )
}
