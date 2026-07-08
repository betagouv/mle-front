'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import Select from '@codegouvfr/react-dsfr/Select'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { OWNER_CONTACT_MODE_LABELS, OWNER_CONTACT_MODES } from '~/enums/owner-contact-mode'
import { type TOwnerFormData, ZOwnerFormSchema } from '~/schemas/owner-form'

interface OwnerFormProps {
  defaultValues?: Partial<TOwnerFormData>
  onSubmit: (data: TOwnerFormData) => void
  isPending?: boolean
  submitLabel?: string
}

export const OwnerForm = ({ defaultValues, onSubmit, isPending, submitLabel = 'Enregistrer' }: OwnerFormProps) => {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<TOwnerFormData>({
    resolver: zodResolver(ZOwnerFormSchema),
    defaultValues: {
      name: '',
      url: '',
      landingUrl: '',
      contactMode: 'none',
      ...defaultValues,
    },
  })

  const contactMode = watch('contactMode')

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        label="Nom du gestionnaire"
        nativeInputProps={register('name')}
        state={errors.name ? 'error' : 'default'}
        stateRelatedMessage={errors.name?.message}
      />
      <Input
        label="Site web (optionnel)"
        nativeInputProps={{ type: 'url', ...register('url') }}
        state={errors.url ? 'error' : 'default'}
        stateRelatedMessage={errors.url?.message}
      />
      <Input
        label="Page de présentation du bailleur (optionnel)"
        hintText="URL affichée sur la fiche logement, sous « gérée par le gestionnaire »"
        nativeInputProps={{ type: 'url', ...register('landingUrl') }}
        state={errors.landingUrl ? 'error' : 'default'}
        stateRelatedMessage={errors.landingUrl?.message}
      />
      <Select
        label="Mode de réception des candidatures"
        nativeSelectProps={{
          value: contactMode,
          onChange: (e) => setValue('contactMode', e.target.value as TOwnerFormData['contactMode']),
        }}
      >
        {OWNER_CONTACT_MODES.map((mode) => (
          <option key={mode} value={mode}>
            {OWNER_CONTACT_MODE_LABELS[mode]}
          </option>
        ))}
      </Select>
      <Button type="submit" disabled={isPending} className="fr-mt-2w">
        {isPending ? 'Enregistrement...' : submitLabel}
      </Button>
    </form>
  )
}
