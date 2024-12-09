import React, { FC } from 'react'
import { Badge } from '@codegouvfr/react-dsfr/Badge'
import { Card } from '@codegouvfr/react-dsfr/Card'
import { Tag } from '@codegouvfr/react-dsfr/Tag'
import { useTranslations } from 'next-intl'
import { fr } from '@codegouvfr/react-dsfr'

interface AccomodationCardProps {
  imageUri: string
  localisation: string
  nbAccomodations: number
  price: string
  surface: string
  title: string
  type: string
}

export const AccomodationCard: FC<AccomodationCardProps> = ({ localisation, nbAccomodations, price, surface, title, type }) => {
  const t = useTranslations('findAccomodation.card')
  return (
    <Card
      background
      badge={<Badge severity="new">{`${t('priceFrom')} ${price}`}</Badge>}
      border
      desc={
        <>
          <span className={fr.cx('ri-shape-fill')}>{surface}</span>
          <br />
          <span className={fr.cx('ri-group-line')}>{type}</span>
          <br />
          <span className={fr.cx('ri-community-line')}>{`${nbAccomodations} logements`}</span>
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
            <Tag>{localisation}</Tag>
          </li>
        </ul>
      }
      size="medium"
      title={title}
      titleAs="h3"
    />
  )
}
