'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { FC, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { ZLoginForm } from '~/schemas/login/login'

export const LoginForm: FC = () => {
  const t = useTranslations('login')
  const { classes } = useStyles()

  const loginForm = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    resolver: zodResolver(ZLoginForm),
  })
  const [showPassword, setShowPassword] = useState(false)
  const { formState, getValues, handleSubmit, register } = loginForm

  const onSubmit = async () => {
    console.log(getValues())
  }

  return (
    <FormProvider {...loginForm}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={classes.formContainer}>
          <div className={classes.inputContainer}>
            <Input
              label={
                <>
                  {t('labels.email')}
                  &nbsp;<span className={clsx(fr.cx('fr-text--bold'), classes.required)}>*</span>{' '}
                </>
              }
              state={formState.errors.email ? 'error' : undefined}
              stateRelatedMessage={formState.errors.email?.message}
              nativeInputProps={{
                ...register('email'),
              }}
            />

            <Input
              addon={
                <Button
                  iconId="ri-eye-line"
                  priority="tertiary"
                  type="button"
                  title="Afficher le mot de passe"
                  nativeButtonProps={{ onClick: () => setShowPassword(!showPassword) }}
                />
              }
              label={
                <>
                  {t('labels.password')}
                  &nbsp;<span className={clsx(fr.cx('fr-text--bold'), classes.required)}>*</span>
                </>
              }
              state={formState.errors.password ? 'error' : undefined}
              stateRelatedMessage={formState.errors.password?.message}
              nativeInputProps={{
                ...register('password'),
                type: showPassword ? 'text' : 'password',
              }}
            />
          </div>
          <div>
            <Link className={fr.cx('fr-link')} href="/mot-de-passe-oublie">
              {t('labels.forgotPassword')}
            </Link>
          </div>
          <Button type="submit" iconPosition="right" iconId="ri-arrow-right-line">
            {t('labels.cta')}
          </Button>
        </div>
      </form>
    </FormProvider>
  )
}

const useStyles = tss.create({
  inputContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  required: {
    color: 'red',
  },
})
