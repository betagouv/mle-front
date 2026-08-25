'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import Button from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { useQuery } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { DF_TENANT_STATUS_VERIFIED, type DFTenantStatus } from '~/enums/dossier-facile-tenant-status'
import { useDisconnectDossierFacile } from '~/hooks/use-disconnect-dossier-facile'
import { useTRPC } from '~/server/trpc/client'

const disconnectModal = createModal({ id: 'disconnect-dossier-facile-modal', isOpenedByDefault: false })

/** Sévérité DSFR du badge de statut. Tout ce qui n'est pas validé reste neutre. */
const STATUS_SEVERITY: Partial<Record<DFTenantStatus, 'success' | 'warning' | 'error'>> = {
  verified: 'success',
  to_process: 'warning',
  incomplete: 'warning',
  denied: 'error',
  access_revoked: 'error',
}

/**
 * Section « Mon compte DossierFacile » de l'espace étudiant.
 *
 * Rien à afficher tant qu'aucun compte n'est lié : la connexion se fait depuis la page d'une
 * résidence, pas ici.
 */
export const DossierFacileConnection = () => {
  const t = useTranslations('student.personalInformations.dossierFacile')
  const trpc = useTRPC()
  const { data: tenant, isPending } = useQuery(trpc.dossierFacile.tenant.queryOptions())
  const { mutate, isPending: isDisconnecting } = useDisconnectDossierFacile()

  if (isPending || !tenant) return null

  const status = tenant.status as DFTenantStatus | null

  return (
    <div className="fr-border-top fr-pt-5w">
      <h2 className="fr-h4">{t('title')}</h2>
      <p className="fr-text--sm fr-text-mention--grey">{t('description')}</p>

      {status && (
        <p className="fr-mb-3w">
          <Badge severity={STATUS_SEVERITY[status]} noIcon={status !== DF_TENANT_STATUS_VERIFIED}>
            {t(`status.${status}`)}
          </Badge>
        </p>
      )}

      <Button priority="secondary" iconId="ri-link-unlink" {...disconnectModal.buttonProps} disabled={isDisconnecting}>
        {t('disconnect')}
      </Button>

      <disconnectModal.Component
        title={t('confirmTitle')}
        buttons={[
          { children: t('cancel'), doClosesModal: true },
          { children: t('confirm'), onClick: () => mutate(), doClosesModal: true },
        ]}
      >
        <p>{t('confirmBody')}</p>
        <p className="fr-mb-0">{t('confirmWarning')}</p>
      </disconnectModal.Component>
    </div>
  )
}
