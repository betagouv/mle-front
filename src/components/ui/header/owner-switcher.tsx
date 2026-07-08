'use client'

import Select from '@codegouvfr/react-dsfr/Select'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

import { buildHref } from '~/utils/preserve-query-params'

// Les pages de détail (contact, résidence, utilisateur) sont rattachées à un bailleur :
// on revient à la liste de la section quand on change de bailleur.
const OWNER_SCOPED_SECTIONS = ['/bailleur/contacts', '/bailleur/residences', '/bailleur/utilisateurs']

function getTargetPathname(pathname: string) {
  return OWNER_SCOPED_SECTIONS.find((section) => pathname.startsWith(`${section}/`)) ?? pathname
}

interface OwnerSwitcherProps {
  owners: Array<{ id: number; name: string; slug: string }>
  defaultOwnerId?: number
}

export function OwnerSwitcher({ owners, defaultOwnerId }: OwnerSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentOwnerId = searchParams.get('ownerId') ?? defaultOwnerId?.toString()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      // buildHref ne conserve que les params persistés : la pagination et les filtres
      // du bailleur précédent sont automatiquement réinitialisés.
      router.push(buildHref(getTargetPathname(pathname), searchParams, { ownerId: e.target.value || null }))
    },
    [router, pathname, searchParams],
  )

  return (
    <div style={{ minWidth: '200px' }}>
      <Select
        label={null}
        nativeSelectProps={{
          value: currentOwnerId ?? '',
          onChange: handleChange,
        }}
      >
        {owners.map((owner) => (
          <option key={owner.id} value={owner.id}>
            {owner.name}
          </option>
        ))}
      </Select>
    </div>
  )
}
