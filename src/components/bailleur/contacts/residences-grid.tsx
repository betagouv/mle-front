'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import { Avatar } from '@codegouvfr/react-dsfr/picto'
import { SearchBar } from '@codegouvfr/react-dsfr/SearchBar'
import { useQuery } from '@tanstack/react-query'
import { useSearchParams } from 'next/navigation'
import { parseAsString, useQueryState } from 'nuqs'
import { useDebounce } from 'use-debounce'
import type { OwnerContactMode } from '~/enums/owner-contact-mode'
import { useTRPC } from '~/server/trpc/client'
import { ContactModeSettingsModal, contactModeSettingsModal } from './contact-mode-settings-modal'
import { ResidenceContactCard } from './residence-contact-card'
import styles from './residences-grid.module.css'

interface Props {
  mode: Exclude<OwnerContactMode, 'none'>
}

export const ResidencesGrid = ({ mode }: Props) => {
  const trpc = useTRPC()
  const searchParams = useSearchParams()
  const ownerId = searchParams.get('ownerId') ? Number(searchParams.get('ownerId')) : undefined

  const [recherche, setRecherche] = useQueryState('recherche', parseAsString.withDefault(''))
  const [debounced] = useDebounce(recherche, 300)

  const { data } = useQuery(
    trpc.bailleur.listResidencesWithContactCounts.queryOptions({
      search: debounced && debounced.length >= 2 ? debounced : undefined,
      ownerId,
    }),
  )

  const residences = data?.residences ?? []
  const title = mode === 'dossier_facile' ? 'Contacts avec DossierFacile' : 'Contacts'

  return (
    <>
      <div className={styles.header}>
        <div className="fr-flex fr-align-items-center fr-flex-gap-3v">
          <Avatar width={72} height={72} color="blue-ecume" />
          <h1 className="fr-mb-0">{title}</h1>
        </div>
        <div className="fr-flex fr-align-items-center fr-flex-gap-2v">
          <SearchBar
            className={styles.search}
            label="Rechercher une résidence"
            renderInput={({ className, id, type, placeholder }) => (
              <input
                className={className}
                id={id}
                type={type}
                placeholder={placeholder}
                value={recherche}
                onChange={(e) => setRecherche(e.target.value || null)}
              />
            )}
          />
          <Button
            {...contactModeSettingsModal.buttonProps}
            priority="secondary"
            iconId="ri-settings-3-line"
            title="Réglages du mode de contact"
          />
        </div>
      </div>

      {residences.length === 0 ? (
        <p className="fr-py-8w fr-text--center fr-text-mention--grey">Aucune résidence.</p>
      ) : (
        <div className={styles.grid}>
          {residences.map((r) => (
            <ResidenceContactCard
              key={r.id}
              slug={r.slug}
              name={r.name}
              cityName={r.cityName}
              departmentCode={r.departmentCode}
              aRappelerCount={r.aRappelerCount}
            />
          ))}
        </div>
      )}

      <ContactModeSettingsModal currentMode={mode} ownerId={ownerId} />
    </>
  )
}
