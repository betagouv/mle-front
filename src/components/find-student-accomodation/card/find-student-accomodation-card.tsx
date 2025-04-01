'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { Card } from '@codegouvfr/react-dsfr/Card'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useTranslations } from 'next-intl'
import { parseAsString, useQueryState } from 'nuqs'
import { FC } from 'react'
import { FindStudentAccommodationImageCard } from '~/components/find-student-accomodation/card/find-student-accommodation-image-card'
import { TAccomodationCard } from '~/schemas/accommodations/accommodations'

type AccomodationCardProps = {
  accomodation: TAccomodationCard
}

export const AccomodationCard: FC<AccomodationCardProps> = ({ accomodation }) => {
  const [selectedAccommodation] = useQueryState('id', parseAsString)
  const t = useTranslations('findAccomodation.card')
  const { city, images_base64, name, nb_total_apartments, postal_code, price_min } = accomodation.properties
  const surface = '100m2'
  const type = 'T1'

  const badgeProps = price_min ? { badge: <Badge severity="new" noIcon>{`${t('priceFrom')} ${price_min}€`}</Badge> } : {}
  const imageProps =
    images_base64 && images_base64.length > 0
      ? { imageComponent: <FindStudentAccommodationImageCard image={images_base64[0]} name={name} /> }
      : {
          imageAlt: 'Placeholder image',
          imageUrl: 'https://www.systeme-de-design.gouv.fr/img/placeholder.16x9.png',
        }
  return (
    <Card
      {...badgeProps}
      {...imageProps}
      shadow={selectedAccommodation === accomodation.id.toString()}
      id={`accomodation-${accomodation.id}`}
      background
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
      linkProps={{
        href: `/logement/${accomodation.properties.slug}`,
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
