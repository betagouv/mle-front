'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { PasswordInput } from '@codegouvfr/react-dsfr/blocks/PasswordInput'
import { Input } from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { usePasswordRuleMessages } from '~/hooks/use-password-rule-messages'
import { useStudentRegistration } from '~/hooks/use-student-registration'
import { ZSignUpForm } from '~/schemas/sign-up/sign-up'

export const SignUpForm: FC = () => {
  const t = useTranslations('signUp')
  const { mutateAsync, isLoading } = useStudentRegistration()

  const { classes } = useStyles()

  const loginForm = useForm({
    defaultValues: {
      firstname: '',
      lastname: '',
      email: '',
      password: '',
    },
    resolver: zodResolver(ZSignUpForm),
  })
  const { formState, getValues, handleSubmit, register } = loginForm

  const onSubmit = async () => await mutateAsync(getValues())

  const { errors } = formState
  const { lastname, firstname, email, password } = errors || {}
  const passwordRules = usePasswordRuleMessages(!!password)
  return (
    <FormProvider {...loginForm}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Input
          label={t('labels.lastname')}
          state={lastname ? 'error' : undefined}
          stateRelatedMessage={lastname?.message}
          nativeInputProps={{
            ...register('lastname'),
          }}
        />
        <Input
          label={t('labels.firstname')}
          state={firstname ? 'error' : undefined}
          stateRelatedMessage={firstname?.message}
          nativeInputProps={{
            ...register('firstname'),
          }}
        />
        <Input
          label={t('labels.email')}
          state={email ? 'error' : undefined}
          stateRelatedMessage={email?.message}
          nativeInputProps={{
            ...register('email'),
          }}
        />

        <PasswordInput
          label={t('labels.password')}
          messagesHint={passwordRules.messagesHint}
          messages={passwordRules.messages}
          nativeInputProps={{
            ...register('password'),
          }}
        />
        <div className={classes.ctasContainer}>
          <Button type="submit" iconPosition="right" iconId="ri-arrow-right-line" disabled={isLoading}>
            {isLoading ? 'Inscription en cours...' : t('labels.cta')}
          </Button>
          <div>
            <Link className={fr.cx('fr-link')} href="/politique-de-confidentialite">
              {t('labels.privacyPolicy')}
            </Link>
          </div>
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
  ctasContainer: {
    display: 'flex',
    marginTop: '1.5rem',
    '@media (min-width: 768px)': {
      justifyContent: 'space-between',
      alignItems: 'center',
      flexDirection: 'row',
    },
    '@media (max-width: 768px)': {
      flexDirection: 'column-reverse',
      gap: '1rem',
    },
  },
})
