'use client'

import Tile from '@codegouvfr/react-dsfr/Tile'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useCities } from '~/hooks/use-cities'
import { TCity } from '~/schemas/territories'

interface PopularCitiesProps {
  cities: TCity[]
}

export const PopularCities: FC<PopularCitiesProps> = ({ cities }) => {
  const { classes } = useStyles()
  const { data, isLoading } = useCities()

  const mockDetail = 'Budget minimum 600€'
  if (isLoading) return null

  return (
    <div className={classes.tilesGrid}>
      {(data || cities).map((city) => (
        <Tile
          noIcon
          key={city.id}
          desc={`${city.nb_apartments} logements étudiants`}
          detail={mockDetail}
          linkProps={{
            href: `/preparer-sa-vie-etudiante/${city.name}`,
          }}
          orientation="vertical"
          title={city.name}
          titleAs="h3"
        />
      ))}
    </div>
  )
}
const useStyles = tss.create({
  tilesGrid: {
    '@media (min-width: 768px)': {
      gridTemplateColumns: 'repeat(4, 1fr)',
    },
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: '1fr',
  },
})
