'use client'

import { colors, fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import type { OwnerContactMode } from '~/enums/owner-contact-mode'
import { buildHref } from '~/utils/preserve-query-params'
import styles from './contact-mode-promo-banner.module.css'

const DISMISS_KEY = 'mle-contact-mode-promo-dismissed'

type OwnerOption = { id: number; contactMode?: OwnerContactMode }

type Props = {
  contactMode: OwnerContactMode
  adminOwners: OwnerOption[]
  defaultOwnerId?: number
}

export const ContactModePromoBannerClient = ({ contactMode, adminOwners, defaultOwnerId }: Props) => {
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    setDismissed(sessionStorage.getItem(DISMISS_KEY) === 'true')
  }, [])

  const currentOwnerId = searchParams.get('ownerId') ?? defaultOwnerId?.toString()
  const selectedOwner = currentOwnerId ? adminOwners.find((owner) => owner.id === Number(currentOwnerId)) : null
  const selectedContactMode = selectedOwner?.contactMode ?? contactMode

  if (selectedContactMode !== 'none' || dismissed || pathname === '/bailleur/contacts') return null

  const dismiss = () => {
    sessionStorage.setItem(DISMISS_KEY, 'true')
    setDismissed(true)
  }

  return (
    <div
      className={clsx(styles.bannerContainer, fr.cx('fr-py-1w'))}
      style={{
        backgroundColor: colors.decisions.background.alt.blueFrance.default,
        color: colors.decisions.text.default.info.default,
      }}
    >
      <div className={clsx(fr.cx('fr-container'), styles.bannerContent)}>
        <p className={styles.bannerText}>
          <span className={clsx(fr.cx('fr-text--bold', 'ri-team-line'), styles.bannerTitle)}>Recevez facilement des candidatures</span>
          &nbsp;
          <span>
            d'étudiants sur votre espace{' '}
            <Link className={clsx(fr.cx('fr-link'), styles.bannerLink)} href={buildHref('/bailleur/contacts', searchParams)}>
              Recevoir des candidatures
            </Link>
          </span>
        </p>
        <Button priority="tertiary no outline" iconId="ri-close-line" size="small" title="Masquer ce message" onClick={dismiss} />
      </div>
    </div>
  )
}
