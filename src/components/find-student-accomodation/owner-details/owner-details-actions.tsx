'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { tss } from 'tss-react'
import { createToast } from '~/components/ui/createToast'

export const OwnerDetailsActions = ({ title, location }: { title: string; location: string }) => {
  const t = useTranslations('accomodation')
  const { classes } = useStyles()
  const [currentUrl, setCurrentUrl] = useState('')

  useEffect(() => {
    setCurrentUrl(window.location.href)
  }, [])

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(currentUrl)
      createToast({
        priority: 'success',
        message: 'Copié dans le presse-papiers',
      })
    } catch {
      createToast({
        priority: 'error',
        message: 'Erreur lors de la copie dans le presse-papiers',
      })
    }
  }, [currentUrl])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  const mailtoUrl = `mailto:?subject=${t('sidebar.emailSubject', { location, title })}&body=${encodeURIComponent(t('sidebar.emailBody', { url: currentUrl, location, title }))}`

  return (
    <div className={classes.sidebarShare}>
      <p className={fr.cx('fr-m-0')}>{t('sidebar.share')}</p>
      <div className={classes.buttonGroup}>
        <Button size="small" iconId="ri-links-line" priority="tertiary" title={t('sidebar.buttons.link')} onClick={handleCopyLink} />
        <Button size="small" iconId="ri-mail-line" priority="tertiary" title={t('sidebar.buttons.email')} linkProps={{ href: mailtoUrl }} />
        <Button size="small" iconId="ri-printer-line" priority="tertiary" title={t('sidebar.buttons.print')} onClick={handlePrint} />
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
