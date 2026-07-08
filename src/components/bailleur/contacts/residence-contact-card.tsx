'use client'

import Badge from '@codegouvfr/react-dsfr/Badge'
import { useRouter, useSearchParams } from 'next/navigation'
import { buildHref } from '~/utils/preserve-query-params'
import styles from './residence-contact-card.module.css'

interface Props {
  slug: string
  name: string
  cityName: string | null
  departmentCode: string | null
  aRappelerCount: number
}

export const ResidenceContactCard = ({ slug, name, cityName, departmentCode, aRappelerCount }: Props) => {
  const router = useRouter()
  const searchParams = useSearchParams()

  const location = cityName ? `${cityName}${departmentCode ? ` (${departmentCode})` : ''}` : null

  return (
    <button type="button" className={styles.card} onClick={() => router.push(buildHref(`/bailleur/contacts/${slug}`, searchParams))}>
      <span className={styles.title}>{name}</span>
      {location && <span className={styles.location}>{location}</span>}
      <span className={styles.badge}>
        <Badge severity="new" small noIcon>
          {aRappelerCount} à rappeler
        </Badge>
      </span>
    </button>
  )
}
