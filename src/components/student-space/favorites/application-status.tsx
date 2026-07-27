'use client'

import clsx from 'clsx'
import { useTranslations } from 'next-intl'
import type { FC } from 'react'
import type { TFavoriteApplicationKind } from '~/server/trpc/routers/favorites'
import styles from './application-status.module.css'

export const ApplicationStatus: FC<{ kind: TFavoriteApplicationKind }> = ({ kind }) => {
  const t = useTranslations('student.favorites.application')

  return (
    <div className={styles.footer}>
      <span className={clsx('ri-checkbox-circle-line', styles.icon)} aria-hidden="true" />
      <p className={clsx('fr-text--md', styles.label)}>
        {t('sent')}
        <span className={clsx('fr-text--sm fr-mb-0', styles.detail)}>
          {kind === 'dossier_facile' ? t.rich('withDossierFacile', { b: (chunks) => <b>{chunks}</b> }) : t('contactShared')}
        </span>
      </p>
    </div>
  )
}
