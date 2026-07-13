'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import clsx from 'clsx'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { type HelpSimulatorFormData } from '~/components/helps-simulator/help-simulator-schema'
import { useSaveHousingAidSimulation } from '~/hooks/use-housing-aid-simulation'
import { authClient } from '~/services/better-auth-client'
import { storePendingAidSimulation } from '~/utils/pending-aid-simulation'
import styles from './save-simulation-banner.module.css'

interface SaveSimulationBannerProps {
  formData: HelpSimulatorFormData
}

export const SaveSimulationBanner: FC<SaveSimulationBannerProps> = ({ formData }) => {
  const t = useTranslations('simulator.results.saveBanner')
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const { mutateAsync: saveSimulation, isLoading: isSaving } = useSaveHousingAidSimulation()

  const isAuthenticated = !!session

  const handleSave = async () => {
    try {
      await saveSimulation(formData)
      router.push('/mon-espace/aides-au-logement')
    } catch {
      // L'erreur est déjà remontée via un toast par le hook.
    }
  }

  const handleCreateAccount = () => {
    storePendingAidSimulation(formData)
    router.push('/s-inscrire')
  }

  return (
    <div className={clsx('fr-mt-4w', styles.container)}>
      <span className={clsx('ri-account-pin-circle-line fr-mb-2w', styles.icon)} aria-hidden="true" />
      <h2 className={clsx('fr-h4 fr-mb-2w', styles.title)}>
        {t('titleLine1')}
        <br />
        {t('titleLine2')}
      </h2>
      <p className={clsx('fr-text--sm fr-mb-3w', styles.subtitle)}>
        {t.rich('description', { strong: (chunks) => <strong>{chunks}</strong> })}
      </p>

      {isAuthenticated ? (
        <Button iconId="ri-bookmark-line" iconPosition="left" onClick={handleSave} disabled={isSaving || isSessionPending}>
          {t('saveButton')}
        </Button>
      ) : (
        <Button iconId="ri-user-add-line" iconPosition="left" onClick={handleCreateAccount} disabled={isSessionPending}>
          {t('createAccountButton')}
        </Button>
      )}
    </div>
  )
}
