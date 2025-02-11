'use client'

import React, { FC } from 'react'
import { TAccomodationCard } from '~/schemas/accommodations/accommodations'
import { Card } from '@codegouvfr/react-dsfr/Card'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useTranslations } from 'next-intl'
import { fr } from '@codegouvfr/react-dsfr'
import { parseAsString, useQueryState } from 'nuqs'

type AccomodationCardProps = {
  accomodation: TAccomodationCard
}

export const AccomodationCard: FC<AccomodationCardProps> = ({ accomodation }) => {
  const [selectedAccommodation] = useQueryState('id', parseAsString)
  const t = useTranslations('findAccomodation.card')
  const { city, name, nb_total_apartments, postal_code } = accomodation.properties
  const price = '153'
  const surface = '100m2'
  const type = 'T1'

  return (
    <Card
      shadow={selectedAccommodation === accomodation.id.toString()}
      id={`accomodation-${accomodation.id}`}
      background
      badge={<Badge severity="new" noIcon>{`${t('priceFrom')} ${price}€`}</Badge>}
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
      imageAlt="Image descriptive du logement"
      imageUrl="https://www.systeme-de-design.gouv.fr/img/placeholder.16x9.png"
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
