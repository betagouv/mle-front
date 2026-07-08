'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import z from 'zod'
import { CompleteProfileModal, completeProfileModal } from '~/components/student-space/profile/complete-profile-modal'
import { createToast } from '~/components/ui/createToast'
import type { ApartmentType } from '~/enums/apartment-type'
import type { OwnerContactMode } from '~/enums/owner-contact-mode'
import { trackEvent } from '~/lib/tracking'
import type { TStudentProfileInfo } from '~/schemas/student-profile/student-profile'
import { useTRPC, useTRPCClient } from '~/server/trpc/client'
import { authClient } from '~/services/better-auth-client'
import { isStudentProfileComplete } from '~/utils/student-profile'
import { CandidatureModal, useCandidatureModal } from './candidature-modal'

interface Props {
  accommodationSlug: string
  availableApartmentTypes: ApartmentType[]
  isAuthenticated: boolean
  contactMode: OwnerContactMode
}

export const DossierFacileLinkButton = ({ accommodationSlug, availableApartmentTypes, isAuthenticated, contactMode }: Props) => {
  if (!isAuthenticated || contactMode === 'none') return null
  if (contactMode === 'contacts') return <ContactRequestButton accommodationSlug={accommodationSlug} />
  return <DossierFacileApplyButton accommodationSlug={accommodationSlug} availableApartmentTypes={availableApartmentTypes} />
}

// ─── Mode contacts : laisser ses coordonnées ─────────────────────────────────

const ContactRequestButton = ({ accommodationSlug }: { accommodationSlug: string }) => {
  const trpc = useTRPC()
  const queryClient = useQueryClient()
  const { data: session } = authClient.useSession()
  const profileComplete = isStudentProfileComplete(session?.user)

  const { data: existing, isLoading } = useQuery(trpc.contacts.myRequest.queryOptions({ accommodationSlug }))

  const { mutate, isPending } = useMutation(
    trpc.contacts.create.mutationOptions({
      onSuccess: () => {
        trackEvent({ category: 'Contacts', action: 'Laisser mes coordonnées' })
        createToast({ priority: 'success', message: 'Vos coordonnées ont bien été transmises au gestionnaire.' })
        queryClient.invalidateQueries({ queryKey: trpc.contacts.myRequest.queryKey({ accommodationSlug }) })
      },
      onError: () => createToast({ priority: 'error', message: 'Une erreur est survenue. Veuillez réessayer.' }),
    }),
  )

  if (isLoading) {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button priority="primary" className="fr-width-full fr-flex fr-justify-content-center" disabled>
          Chargement en cours
        </Button>
      </div>
    )
  }

  if (existing) {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button priority="primary" className="fr-width-full fr-flex fr-justify-content-center" disabled>
          Coordonnées transmises
        </Button>
      </div>
    )
  }

  const handleClick = () => {
    if (!profileComplete) {
      completeProfileModal.open()
      return
    }
    mutate({ accommodationSlug })
  }

  return (
    <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
      <Button onClick={handleClick} priority="primary" className="fr-width-full fr-flex fr-justify-content-center" disabled={isPending}>
        Être recontacté
      </Button>
      <span className="fr-text--xs fr-mb-0">Laissez vos coordonnées, le gestionnaire vous recontactera par e-mail ou téléphone.</span>
      {!profileComplete && (
        <CompleteProfileModal
          mandatory
          defaultValues={{
            phone: session?.user?.phone,
            birthdate: session?.user?.birthdate,
            scholarshipStatus: session?.user?.scholarshipStatus as TStudentProfileInfo['scholarshipStatus'] | null,
          }}
          onCompleted={() => mutate({ accommodationSlug })}
        />
      )}
    </div>
  )
}

// ─── Mode DossierFacile : candidater avec le dossier ─────────────────────────

const DossierFacileApplyButton = ({
  accommodationSlug,
  availableApartmentTypes,
}: {
  accommodationSlug: string
  availableApartmentTypes: ApartmentType[]
}) => {
  const t = useTranslations('accomodation')
  const trpc = useTRPC()
  const trpcClient = useTRPCClient()
  const candidatureModal = useCandidatureModal(accommodationSlug)
  const { data: session } = authClient.useSession()
  const profileComplete = isStudentProfileComplete(session?.user)

  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    ...trpc.dossierFacile.tenant.queryOptions(),
  })

  const { data: application, isLoading: isApplicationLoading } = useQuery({
    ...trpc.dossierFacile.listApplications.queryOptions({ accommodationSlug }),
    enabled: !!tenant,
  })

  const handleConnect = async () => {
    trackEvent({ category: 'Dossier Facile', action: 'Candidater avec Dossier Facile' })
    const { authorizationUrl } = await trpcClient.dossierFacile.connectUrl.mutate({
      returnTo: window.location.pathname + window.location.search,
    })
    window.location.href = authorizationUrl
  }

  const tenantUrl = tenant?.url ?? z.string().parse(process.env.NEXT_PUBLIC_DOSSIERFACILE_LOCATAIRE_URL)

  if (isTenantLoading || isApplicationLoading) {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button priority="primary" className="fr-width-full fr-flex fr-justify-content-center" disabled>
          Chargement en cours
        </Button>
      </div>
    )
  }

  if (!tenant) {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button onClick={handleConnect} priority="primary" className="fr-width-full fr-flex fr-justify-content-center">
          {t('sidebar.buttons.dossierFacileConnect')}
        </Button>
        <span className="fr-text--xs fr-mb-0">{t('sidebar.buttons.dossierFacileConnectDescription')}</span>
      </div>
    )
  }

  if (tenant.status === 'access_revoked' || tenant.status === 'inactive') {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button onClick={handleConnect} priority="primary" className="fr-width-full fr-flex fr-justify-content-center">
          {t('sidebar.buttons.dossierFacileConnect')}
        </Button>
        <span className="fr-text--xs fr-mb-0">{t('sidebar.buttons.dossierFacileConnectDescription')}</span>
      </div>
    )
  }

  if (tenant.status === 'incomplete') {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button
          priority="primary"
          className="fr-width-full fr-flex fr-justify-content-center"
          linkProps={{ href: tenantUrl, target: '_blank', rel: 'noopener noreferrer' }}
        >
          {t('sidebar.buttons.dossierFacileIncomplete')}
        </Button>
      </div>
    )
  }

  if (tenant.status === 'denied') {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button
          priority="primary"
          className="fr-width-full fr-flex fr-justify-content-center"
          linkProps={{ href: tenantUrl, target: '_blank', rel: 'noopener noreferrer' }}
        >
          {t('sidebar.buttons.dossierFacileDenied')}
        </Button>
      </div>
    )
  }

  if (application) {
    // Candidature enregistrée, mais transmise au gestionnaire seulement une fois le dossier validé.
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button priority="primary" className="fr-width-full fr-flex fr-justify-content-center" disabled>
          {t(tenant.status === 'verified' ? 'sidebar.buttons.dossierFacileApplied' : 'sidebar.buttons.dossierFacilePending')}
        </Button>
      </div>
    )
  }

  if (availableApartmentTypes.length === 0) return null

  // Infos étudiant manquantes : bloquer la candidature derrière la modale de complétion (obligatoire).
  if (!profileComplete) {
    return (
      <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
        <Button {...completeProfileModal.buttonProps} priority="primary" className="fr-width-full fr-flex fr-justify-content-center">
          {t('sidebar.buttons.dossierFacileApply')}
        </Button>
        <span className="fr-text--xs fr-mb-0">{t('sidebar.buttons.dossierFacileDescription')}</span>
        <CompleteProfileModal
          mandatory
          defaultValues={{
            phone: session?.user?.phone,
            birthdate: session?.user?.birthdate,
            scholarshipStatus: session?.user?.scholarshipStatus as TStudentProfileInfo['scholarshipStatus'] | null,
          }}
        />
      </div>
    )
  }

  return (
    <div className="fr-flex fr-direction-column fr-align-items-center fr-mt-2w fr-width-full">
      <Button {...candidatureModal.buttonProps} priority="primary" className="fr-width-full fr-flex fr-justify-content-center">
        {t('sidebar.buttons.dossierFacileApply')}
      </Button>
      <span className="fr-text--xs fr-mb-0">{t('sidebar.buttons.dossierFacileDescription')}</span>
      <CandidatureModal accommodationSlug={accommodationSlug} availableApartmentTypes={availableApartmentTypes} />
    </div>
  )
}
