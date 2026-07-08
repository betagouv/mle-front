'use client'

import { Input } from '@codegouvfr/react-dsfr/Input'
import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import { useFormContext } from 'react-hook-form'

const RequiredStar = () => <span style={{ color: 'var(--text-default-error)' }}>&nbsp;*</span>

/**
 * Les trois champs « infos étudiant » (téléphone portable, date de naissance, boursier).
 * Partagé par le formulaire d'inscription et la modale de complétion — à rendre à
 * l'intérieur d'un `FormProvider` dont le schéma expose `phone` / `birthdate` / `scholarshipStatus`.
 */
export const StudentProfileFields = () => {
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
        label={
          <>
            Téléphone portable
            <RequiredStar />
          </>
        }
        state={phoneError ? 'error' : 'default'}
        stateRelatedMessage={phoneError}
        nativeInputProps={{ ...register('phone'), type: 'tel', autoComplete: 'tel' }}
      />
      <Input
        label={
          <>
            Date de naissance
            <RequiredStar />
          </>
        }
        hintText="Format jj/mm/aaaa"
        state={birthdateError ? 'error' : 'default'}
        stateRelatedMessage={birthdateError}
        nativeInputProps={{ ...register('birthdate'), type: 'date' }}
      />
      <RadioButtons
        legend={
          <>
            Êtes-vous boursier ?
            <RequiredStar />
          </>
        }
        state={scholarshipStatusError ? 'error' : 'default'}
        stateRelatedMessage={scholarshipStatusError}
        classes={{ content: 'fr-flex fr-flex-gap-4v fr-align-items-center fr-flex-wrap' }}
        options={[
          { label: 'Oui', nativeInputProps: { ...register('scholarshipStatus'), value: 'yes' } },
          { label: 'Non', nativeInputProps: { ...register('scholarshipStatus'), value: 'no' } },
          { label: 'Je ne sais pas', nativeInputProps: { ...register('scholarshipStatus'), value: 'unknown' } },
        ]}
      />
    </>
  )
}
