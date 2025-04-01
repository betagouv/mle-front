'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useQueryStates } from 'nuqs'
import { parseAsString } from 'nuqs'
import { FC } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { useAlertAccommodation } from '~/hooks/use-alert-accommodation'
import { ZAlertAccommodationFormSchema } from '~/schemas/alert-accommodation/alert-accommodation'
import { AlertAccomodationAutocompleteInput } from '~/schemas/alert-accommodation/autocomplete/alert-accomodation-autocomplete-input'

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
