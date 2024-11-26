'use client'

import ToggleSwitch from '@codegouvfr/react-dsfr/ToggleSwitch'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { tss } from 'tss-react'

export const FindStudentAccessibleAccomodationSwitch: FC = () => {
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()
  return (
    <ToggleSwitch
      classes={{ label: classes.label }}
      inputTitle="accessibility"
      showCheckedHint={false}
      label={t('header.accessbility')}
      labelPosition="right"
    />
  )
}

const useStyles = tss.create({
  label: {
    '&::before': {
      marginRight: '0.5rem !important',
    },
  },
})
