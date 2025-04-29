'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import Input from '@codegouvfr/react-dsfr/Input'
import { zodResolver } from '@hookform/resolvers/zod'
import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import { FC, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { ZResetPasswordForm } from '~/schemas/reset-password/reset-password'

export const ResetPasswordForm: FC = () => {
  // todo: remove that in order to get the mutation status
  const [isResetted, setIsResetted] = useState(false)

  const [passwordState, setPasswordState] = useState({ password: false, confirmPassword: false })
  const t = useTranslations('resetPassword')
  const { classes } = useStyles()

  const resetPasswordForm = useForm({
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
    resolver: zodResolver(ZResetPasswordForm),
  })
  const { getValues, handleSubmit, register } = resetPasswordForm

  const onSubmit = async () => {
    console.log(getValues())
    setIsResetted(true)
  }

  const { errors } = resetPasswordForm.formState
  const { password, confirmPassword } = errors || {}
  return (
    <FormProvider {...resetPasswordForm}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={classes.formContainer}>
          <div className={classes.inputContainer}>
            <Input
              addon={
                <Button
                  iconId="ri-eye-line"
                  priority="tertiary"
                  type="button"
                  title="Afficher le mot de passe"
                  nativeButtonProps={{ onClick: () => setPasswordState({ ...passwordState, password: !passwordState.password }) }}
                />
              }
              state={password ? 'error' : undefined}
              stateRelatedMessage={password?.message}
              hintText={t('labels.newPasswordDescription')}
              label={
                <>
                  {t('labels.newPassword')}
                  &nbsp;<span className={clsx(fr.cx('fr-text--bold'), classes.required)}>*</span>{' '}
                </>
              }
              nativeInputProps={{
                ...register('password'),
                type: passwordState.password ? 'text' : 'password',
              }}
            />
            <Input
              addon={
                <Button
                  iconId="ri-eye-line"
                  priority="tertiary"
                  type="button"
                  title="Afficher le mot de passe"
                  nativeButtonProps={{
                    onClick: () => setPasswordState({ ...passwordState, confirmPassword: !passwordState.confirmPassword }),
                  }}
                />
              }
              state={confirmPassword ? 'error' : undefined}
              stateRelatedMessage={confirmPassword?.message}
              label={
                <>
                  {t('labels.confirmPassword')}
                  &nbsp;<span className={clsx(fr.cx('fr-text--bold'), classes.required)}>*</span>{' '}
                </>
              }
              nativeInputProps={{
                ...register('confirmPassword'),
                type: passwordState.confirmPassword ? 'text' : 'password',
              }}
            />
          </div>

          <Button type="submit" iconPosition="right" iconId="ri-arrow-right-line">
            {t('labels.cta')}
          </Button>
          {isResetted && <Alert description={t('success.description')} severity="success" small />}
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
    gap: '2rem',
  },
  required: {
    color: 'red',
  },
})
