'use client'

import { createModal } from '@codegouvfr/react-dsfr/Modal'
import MainSend from '@codegouvfr/react-dsfr/picto/MainSend'
import RadioButtons from '@codegouvfr/react-dsfr/RadioButtons'
import { useMutation } from '@tanstack/react-query'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createToast } from '~/components/ui/createToast'
import type { OwnerContactMode } from '~/enums/owner-contact-mode'
import dossierFacile from '~/images/dossier-facile.svg'
import { useTRPC } from '~/server/trpc/client'
import { isDossierFacileSelectable } from '~/utils/feature-flags'

export const contactModeSettingsModal = createModal({
  id: 'contact-mode-settings-modal',
  isOpenedByDefault: false,
})

const MODE_OPTIONS: { mode: OwnerContactMode; label: string; hintText: string; illustration?: React.ReactNode }[] = [
  {
    mode: 'contacts',
    label: "Recevoir les coordonnées d'étudiants",
    hintText: "Nom, prénom, âge, e-mail, téléphone, niveau d'études et situation boursière",
    illustration: <MainSend color="blue-ecume" width={64} height={64} />,
  },
  {
    mode: 'dossier_facile',
    label: 'Activer DossierFacile pour gagner en réactivité',
    hintText: "Recevez un dossier complet des candidats : pièce d'identité, avis d'imposition, justificatifs de ressources, etc.",
    illustration: <Image src={dossierFacile} alt="" width={64} height={64} />,
  },
  {
    mode: 'none',
    label: 'Désactiver les candidatures',
    hintText: 'Les visiteurs sont redirigés vers votre site Internet',
  },
]

interface Props {
  currentMode: OwnerContactMode
  ownerId?: number
}

export const ContactModeSettingsModal = ({ currentMode, ownerId }: Props) => {
  const trpc = useTRPC()
  const router = useRouter()
  const [mode, setMode] = useState<OwnerContactMode>(currentMode)

  const { mutate, isPending } = useMutation(
    trpc.bailleur.setContactMode.mutationOptions({
      onSuccess: () => {
        createToast({ priority: 'success', message: 'Mode de réception mis à jour.' })
        contactModeSettingsModal.close()
        router.refresh()
      },
      onError: () => {
        createToast({ priority: 'error', message: 'Une erreur est survenue.' })
      },
    }),
  )

  return (
    <contactModeSettingsModal.Component
      title="Paramètres des candidatures"
      buttons={[
        {
          children: 'Annuler',
          priority: 'secondary',
          disabled: isPending,
          onClick: () => setMode(currentMode),
        },
        {
          children: isPending ? 'Enregistrement...' : 'Enregistrer',
          priority: 'primary',
          disabled: isPending || mode === currentMode,
          doClosesModal: false,
          onClick: () => mutate({ mode, ownerId }),
        },
      ]}
    >
      <p className="fr-text--sm fr-text-mention--grey">
        Modifiez la manière dont vous centralisez les candidatures d'étudiants sur votre espace gestionnaire, via les fiches candidatures ou
        DossierFacile.
      </p>
      <RadioButtons
        legend="Mode de réception des candidatures"
        classes={{ legend: 'fr-sr-only' }}
        options={MODE_OPTIONS.map((option) => {
          // DossierFacile pas encore ouvert en production, sauf pour un gestionnaire déjà activé
          // (par un admin) qui doit rester libre de revenir à son mode courant.
          const locked = option.mode === 'dossier_facile' && !isDossierFacileSelectable() && currentMode !== 'dossier_facile'

          return {
            label: option.label,
            hintText: locked ? `${option.hintText} — bientôt disponible` : option.hintText,
            // Clé omise si absente : DSFR rend sinon un bloc illustration vide.
            ...(option.illustration ? { illustration: option.illustration } : {}),
            nativeInputProps: {
              value: option.mode,
              checked: mode === option.mode,
              disabled: isPending || locked,
              onChange: () => setMode(option.mode),
            },
          }
        })}
      />{' '}
    </contactModeSettingsModal.Component>
  )
}
