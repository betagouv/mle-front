'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { useTranslations } from 'next-intl'
import { FormProvider, useForm } from 'react-hook-form'
import { FC } from 'react'
import { tss } from 'tss-react'
import { ZAlertAccommodationFormSchema } from '~/schemas/alert-accommodation/alert-accommodation'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertAccomodationAutocompleteInput } from '~/schemas/alert-accommodation/autocomplete/alert-accomodation-autocomplete-input'
import { useAlertAccommodation } from '~/hooks/use-alert-accommodation'
import { useQueryStates } from 'nuqs'
import { parseAsString } from 'nuqs'

export const AlertAccommodationForm: FC = () => {
  const [queryStates] = useQueryStates({ q: parseAsString, type: parseAsString })
  const alertForm = useForm({
    defaultValues: {
      email: '',
      territory_name: queryStates.q || '',
      territory_type: queryStates.type || '',
    },
    resolver: zodResolver(ZAlertAccommodationFormSchema),
  })
  const {
    formState: { isValid },
    getValues,
    handleSubmit,
    register,
  } = alertForm

  const { mutateAsync } = useAlertAccommodation()

  const t = useTranslations('alertLogement')
  const { classes } = useStyles()

  const onSubmit = async () => {
    const data = getValues()
    await mutateAsync(data)
  }

  return (
    <FormProvider {...alertForm}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={classes.inputContainer}>
          <AlertAccomodationAutocompleteInput />
          <Input
            label="Email"
            nativeInputProps={{
              placeholder: t('emailPlaceholder'),
              ...register('email'),
            }}
            addon={
              <Button disabled={!isValid} type="submit">
                {t('subscribe')}
              </Button>
            }
          />
          <p className={classes.disclaimer}>{t('disclaimer')}</p>
        </div>
      </form>
    </FormProvider>
  )
}

const useStyles = tss.create({
  disclaimer: {
    fontSize: '12px',
  },
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
})
