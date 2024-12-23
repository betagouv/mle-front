'use client'

import { ToggleSwitch } from '@codegouvfr/react-dsfr/ToggleSwitch'
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'
import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'

export const FindStudentAccessibleAccomodationSwitch: FC = () => {
  const [isAccessible, setIsAccessible] = useQueryState('isAccessible')
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()

  const handleChange = (value: boolean) => setIsAccessible(value ? 'true' : 'false')

  return (
    <div className={classes.container}>
      <ToggleSwitch
        classes={{ label: classes.label }}
        inputTitle="accessibility"
        showCheckedHint={false}
        label={t('header.accessbility')}
        labelPosition="right"
        checked={isAccessible === 'true'}
        onChange={handleChange}
      />
      <Tooltip kind="hover" title={t('header.tooltip.accessible')} />
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
