'use client'

import { Input } from '@codegouvfr/react-dsfr/Input'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import { useTranslations } from 'next-intl'
import { useFormContext } from 'react-hook-form'
import { RequiredLabel } from '~/components/ui/required-mark'

export const StudentProfileFields = () => {
  const t = useTranslations('student.profile')
  const {
    register,
    formState: { errors },
  } = useFormContext()

  const phoneError = errors.phone?.message as string | undefined
  const birthdateError = errors.birthdate?.message as string | undefined
  const scholarshipStatusError = errors.scholarshipStatus?.message as string | undefined

  return (
    <>
      <Input
        label={<RequiredLabel>{t('phone')}</RequiredLabel>}
        state={phoneError ? 'error' : 'default'}
        stateRelatedMessage={phoneError}
        nativeInputProps={{ ...register('phone'), type: 'tel', autoComplete: 'tel' }}
      />
      <Input
        label={<RequiredLabel>{t('birthdate')}</RequiredLabel>}
        hintText={t('birthdateHint')}
        state={birthdateError ? 'error' : 'default'}
        stateRelatedMessage={birthdateError}
        nativeInputProps={{ ...register('birthdate'), type: 'date' }}
      />
      <RadioButtons
        legend={<RequiredLabel>{t('scholarship')}</RequiredLabel>}
        state={scholarshipStatusError ? 'error' : 'default'}
        stateRelatedMessage={scholarshipStatusError}
        orientation="horizontal"
        options={[
          { label: t('yes'), nativeInputProps: { ...register('scholarshipStatus'), value: 'yes' } },
          { label: t('no'), nativeInputProps: { ...register('scholarshipStatus'), value: 'no' } },
          { label: t('unknown'), nativeInputProps: { ...register('scholarshipStatus'), value: 'unknown' } },
        ]}
      />
    </>
  )
}
