'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Binders from '@codegouvfr/react-dsfr/picto/Binders'
import MainSend from '@codegouvfr/react-dsfr/picto/MainSend'
import { useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { createToast } from '~/components/ui/createToast'
import type { OwnerContactMode } from '~/enums/owner-contact-mode'
import dossierFacile from '~/images/dossier-facile.svg'
import { useTRPC } from '~/server/trpc/client'
import { isDossierFacileSelectable } from '~/utils/feature-flags'

export const ContactsLanding = () => {
  const trpc = useTRPC()
  const router = useRouter()
  const searchParams = useSearchParams()
  const ownerId = searchParams.get('ownerId') ? Number(searchParams.get('ownerId')) : undefined

  const { mutate, isPending } = useMutation(
    trpc.bailleur.setContactMode.mutationOptions({
      onSuccess: () => {
        createToast({ priority: 'success', message: 'Mode de réception des candidatures activé.' })
        router.refresh()
      },
      onError: () => {
        createToast({ priority: 'error', message: "Une erreur est survenue lors de l'activation." })
      },
    }),
  )

  const activate = (mode: Extract<OwnerContactMode, 'contacts' | 'dossier_facile'>) => mutate({ mode, ownerId })

  const dossierFacileSelectable = isDossierFacileSelectable()

  return (
    <div className="fr-flex fr-direction-column fr-align-items-center fr-border fr-background-default--grey fr-col-12 fr-py-6w">
      <div className="fr-col-8">
        <div className="fr-flex fr-direction-column fr-flex-gap-4v fr-align-items-center">
          <Binders color="blue-ecume" width={80} height={80} />
          <h2 className="fr-h3 fr-text--center fr-mb-0">Recevez facilement des contacts de candidats</h2>
          <p className="fr-text--center fr-text--lg">
            Centralisez les demandes d'informations sur votre espace gestionnaire en activant des demandes de contacts de la part des
            étudiants.
          </p>
        </div>

        <div className="fr-flex fr-direction-column fr-direction-md-row">
          <div className="fr-flex fr-direction-column fr-justify-content-space-between fr-border fr-p-3w fr-flex-gap-3v fr-width-full">
            <MainSend color="blue-ecume" width={80} height={80} />

            <h3 className="fr-h5 fr-text-title--blue-france fr-mb-0">Recevez les coordonnées d'étudiants à recontacter</h3>
            <p className="fr-text--sm fr-mb-0">
              Accédez aux coordonnées des candidats intéressés par un logement et recontactez-les directement par e-mail ou par téléphone.
            </p>
            <Button priority="secondary" disabled={isPending} onClick={() => activate('contacts')} size="small">
              Recevoir les contacts
            </Button>
          </div>

          <div className="fr-flex fr-align-items-center fr-justify-content-center fr-px-4w" aria-hidden="true">
            OU
          </div>

          <div className="fr-flex fr-direction-column fr-justify-content-space-between fr-border fr-p-3w fr-flex-gap-3v fr-width-full">
            <Image src={dossierFacile} alt="Dossier Facile Logo" />

            <h3 className="fr-h5 fr-text-title--blue-france fr-mb-0">Activez DossierFacile pour gagner en réactivité</h3>
            <p className="fr-text--sm fr-mb-0">
              Recevez un dossier complet des candidats : pièce d'identité, avis d'imposition, justificatifs de ressources, etc.
            </p>
            <div className="fr-flex fr-direction-column fr-flex-gap-1v">
              <Button
                priority="primary"
                disabled={isPending || !dossierFacileSelectable}
                onClick={() => activate('dossier_facile')}
                size="small"
              >
                Recevoir les dossiers avec DossierFacile
              </Button>
              {!dossierFacileSelectable && <span className="fr-text--xs fr-text-mention--grey fr-mb-0">Bientôt disponible</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
