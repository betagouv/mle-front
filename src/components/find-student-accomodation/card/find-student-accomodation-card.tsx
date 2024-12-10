import React, { FC } from 'react'
import { EResidence } from '~/schemas/accommodations/accommodations'
import { Card } from '@codegouvfr/react-dsfr/Card'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useTranslations } from 'next-intl'
import { fr } from '@codegouvfr/react-dsfr'

type AccomodationCardProps = {
  id: number
  properties: {
    address: string
    city: string
    name: string
    nb_accessible_apartments: number | null
    nb_coliving_apartments: number | null
    nb_t1: number | null
    nb_t1_bis: number | null
    nb_t2: number | null
    nb_t3: number | null
    nb_t4_more: number | null
    nb_total_apartments: number | null
    owner_name: string | null
    owner_url: string | null
    postal_code: string
    residence_type: EResidence
  }
}

export const AccomodationCard: FC<AccomodationCardProps> = ({ ...props }) => {
  const t = useTranslations('findAccomodation.card')
  const { city, name, nb_total_apartments, postal_code } = props.properties
  const price = '100000'
  const surface = '100m2'
  const type = 'T1'

  return (
    <Card
      background
      badge={<Badge severity="new">{`${t('priceFrom')} ${price}e`}</Badge>}
      border
      desc={
        <>
          <span className={fr.cx('ri-shape-fill')}>{surface}</span>
          <br />
          <span className={fr.cx('ri-group-line')}>{type}</span>
          <br />
          {nb_total_apartments && <span className={fr.cx('ri-community-line')}>{`${nb_total_apartments} logements`}</span>}
        </>
      }
      enlargeLink
      imageAlt="texte alternatif de"
      imageUrl="https://www.systeme-de-design.gouv.fr/img/placeholder.16x9.png"
      linkProps={{
        href: '#',
      }}
      start={
        <ul className="fr-tags-group">
          <li>
            <Tag>{`${city} (${postal_code})`}</Tag>
          </li>
        </ul>
      }
      size="medium"
      title={name}
      titleAs="h3"
    />
  )
}

// const useStyles = tss.create({
//   '@keyframes pulse': {
//     '0%, 100%': {
//       opacity: 1,
//     },
//     '50%': {
//       opacity: 0.5,
//     },
//   },
//   card: {
//     backgroundColor: 'white',
//     borderRadius: '0.5rem',
//     boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
//     overflow: 'hidden',
//   },
//   content: {
//     padding: '1rem',
//   },
//   image: {
//     animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//     backgroundColor: '#e5e7eb',
//     height: '200px',
//     width: '100%',
//   },
//   text: {
//     animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//     backgroundColor: '#e5e7eb',
//     borderRadius: '0.25rem',
//     height: '1rem',
//     marginTop: '0.5rem',
//     width: '100%',
//   },
//   title: {
//     animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
//     backgroundColor: '#e5e7eb',
//     borderRadius: '0.25rem',
//     height: '1.5rem',
//     width: '60%',
//   },
// })
