'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'
import { EOwnerContactMode } from '~/enums/owner-contact-mode'
import { buildHref } from '~/utils/preserve-query-params'
import styles from './contact-mode-promo-banner.module.css'

const DISMISS_KEY = 'mle-contact-mode-promo-dismissed'

type OwnerOption = { id: number; contactMode?: EOwnerContactMode }

type Props = {
  contactMode: EOwnerContactMode
  adminOwners: OwnerOption[]
  defaultOwnerId?: number
}

export const ContactModePromoBannerClient = ({ contactMode, adminOwners, defaultOwnerId }: Props) => {
  const t = useTranslations('bailleur.contacts.promoBanner')
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  const currentOwnerId = searchParams.get('ownerId') ?? defaultOwnerId?.toString()
  const selectedOwner = currentOwnerId ? adminOwners.find((owner) => owner.id === Number(currentOwnerId)) : null
  const selectedContactMode = selectedOwner?.contactMode ?? contactMode

  if (selectedContactMode !== EOwnerContactMode.NONE || dismissed || pathname === '/bailleur/contacts') return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div className={clsx('fr-flex fr-py-1w', styles.banner)}>
      <div className="fr-container fr-flex fr-align-items-center fr-justify-content-space-between">
        <p className="fr-mb-0">
          <span className={clsx('fr-text--bold ri-team-line', styles.bannerTitle)}>{t('title')}</span>
          &nbsp;
          <span>
            {t('text')}{' '}
            <Link className={clsx('fr-link fr-ml-1w', styles.bannerLink)} href={buildHref('/bailleur/contacts', searchParams)}>
              {t('link')}
            </Link>
          </span>
        </p>
        <Button priority="tertiary no outline" iconId="ri-close-line" size="small" title={t('dismiss')} onClick={dismiss} />
      </div>
    </div>
  )
}
