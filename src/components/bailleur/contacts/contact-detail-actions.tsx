'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { createToast } from '~/components/ui/createToast'
import { type ContactStatus } from '~/enums/contact-status'
import { useSignedDocumentUrl } from '~/hooks/use-signed-document-url'
import { useTRPC } from '~/server/trpc/client'
import { daysLeftFrom } from '~/utils/dayjs'
import styles from './contact-detail.module.css'

/** Durée d'affichage des coordonnées après traitement du contact (jours). */
const RETENTION_DAYS = 30

interface Props {
  id: string
  source: 'dossier_facile' | 'contact'
  status: string
  /** Identifiant du locataire DossierFacile (mode `dossier_facile` uniquement). */
  dfTenantId?: string
  reviewedAt: string | Date | null
}

export const ContactDetailActions = ({ id, source, status, dfTenantId, reviewedAt }: Props) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { openDocument, isLoading: isOpeningDocument } = useSignedDocumentUrl()

  const { mutate, isPending } = useMutation(
    trpc.bailleur.updateContactStatus.mutationOptions({
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey:
              source === 'dossier_facile' ? trpc.bailleur.getCandidature.queryKey({ id }) : trpc.bailleur.getContact.queryKey({ id }),
          }),
          queryClient.invalidateQueries({ queryKey: trpc.bailleur.listContactsByResidence.queryKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.bailleur.listResidencesWithContactCounts.queryKey() }),
        ])
      },
      onError: () => {
        createToast({ priority: 'error', message: 'Le changement de statut a échoué. Veuillez réessayer.' })
      },
    }),
  )

  const updateStatus = (next: ContactStatus) => mutate({ id, status: next, source })

  // « Accéder au DossierFacile » : ouvre le dossier ET sort la demande de la modération.
  const accessDossierFacile = () => {
    if (dfTenantId) openDocument('tenantUrl', dfTenantId)
    updateStatus('a_contacter')
  }

  if (status === 'contacte') {
    const daysLeft = daysLeftFrom(reviewedAt, RETENTION_DAYS)

    return (
      <div className={clsx(styles.panel, styles.actions)}>
        <span className={clsx('ri-checkbox-circle-line', styles.actionsIcon, styles.actionsIconSuccess)} aria-hidden="true" />
        <p className="fr-text--bold fr-mb-1w">Contact avec l&apos;étudiant réalisé</p>
        {daysLeft !== null && (
          <p className="fr-text--sm fr-text-mention--grey fr-mb-0">
            Les détails du contact seront encore disponibles pendant {daysLeft} jour{daysLeft > 1 ? 's' : ''}.
          </p>
        )}
      </div>
    )
  }

  if (status === 'non_retenu') {
    return (
      <div className={clsx(styles.panel, styles.actions)}>
        <span className={clsx('ri-close-circle-line', styles.actionsIcon, styles.actionsIconError)} aria-hidden="true" />
        <p className="fr-text--bold fr-mb-1w">Contact non retenu</p>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">Vous ne donnerez pas suite à cette demande de contact.</p>
      </div>
    )
  }

  if (status === 'a_moderer') {
    return (
      <div className={clsx(styles.panel, styles.actions)}>
        <span className={clsx('ri-file-list-3-line', styles.actionsIcon)} aria-hidden="true" />
        <p className="fr-text--bold fr-mb-2w">Souhaitez-vous en savoir plus sur la demande ?</p>
        <div className="fr-flex fr-direction-column fr-flex-gap-2v">
          <Button
            priority="secondary"
            iconId="ri-check-line"
            onClick={accessDossierFacile}
            disabled={isPending || isOpeningDocument || !dfTenantId}
          >
            Accéder au DossierFacile
          </Button>
          <Button priority="tertiary no outline" iconId="ri-close-line" onClick={() => updateStatus('non_retenu')} disabled={isPending}>
            Non
          </Button>
        </div>
      </div>
    )
  }

  // Statut « à contacter » (état d'entrée en mode contacts, post-modération en mode DossierFacile).
  return (
    <div className={clsx(styles.panel, styles.actions)}>
      <span className={clsx('ri-file-list-3-line', styles.actionsIcon)} aria-hidden="true" />
      <p className="fr-text--bold fr-mb-2w">Avez-vous contacté l&apos;étudiant ?</p>
      <div className="fr-flex fr-direction-column fr-flex-gap-2v">
        <Button priority="secondary" iconId="ri-check-line" onClick={() => updateStatus('contacte')} disabled={isPending}>
          Oui, j&apos;ai contacté l&apos;étudiant
        </Button>
        <Button priority="tertiary no outline" onClick={() => updateStatus('non_retenu')} disabled={isPending}>
          {source === 'dossier_facile' ? 'Non, je ne souhaite pas retenir sa candidature' : 'Ignorer la demande'}
        </Button>
      </div>
    </div>
  )
}
