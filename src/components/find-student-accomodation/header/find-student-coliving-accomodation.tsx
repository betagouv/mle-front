'use client'

import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'

export const FindStudentColivingAccomodationSwitch: FC = () => {
  const [hasColiving, setHasColiving] = useQueryState('coliving')
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()

  const handleChange = (value: boolean) => setHasColiving(value ? 'true' : 'false')

  return (
    <div className={classes.container}>
      <ToggleSwitch
        classes={{ label: classes.label }}
        inputTitle="accessibility"
        showCheckedHint={false}
        label={t('header.shared')}
        labelPosition="right"
        checked={hasColiving === 'true'}
        onChange={handleChange}
      />
    </div>
  )
}

const useStyles = tss.create({
  container: {
    alignItems: 'center',
    display: 'flex',
    gap: '0.5rem',
  },
  label: {
    '&::before': {
      marginRight: '0.5rem !important',
    },
    width: 'unset !important',
  },
})
