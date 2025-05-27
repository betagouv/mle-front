'use client'
import { tss } from 'tss-react'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { useTranslations } from 'next-intl'

export const OwnerDetailsActions = () => {
  const t = useTranslations('accomodation')
  const { classes } = useStyles()
  return (
    <div className={classes.sidebarShare}>
      <p className={fr.cx('fr-m-0')}>{t('sidebar.share')}</p>
      <div className={classes.buttonGroup}>
        <Button size="small" iconId="ri-links-line" priority="tertiary" title={t('sidebar.buttons.link')} />
        <Button size="small" iconId="ri-mail-line" priority="tertiary" title={t('sidebar.buttons.email')} />
        <Button size="small" iconId="ri-printer-line" priority="tertiary" title={t('sidebar.buttons.print')} />
      </div>
    </div>
  )
}

export const useStyles = tss.create({
  buttonGroup: {
    display: 'flex',
    gap: '1rem',
  },
  sidebarShare: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
})
