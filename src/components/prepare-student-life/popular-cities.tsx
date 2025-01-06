'use client'

import Tile from '@codegouvfr/react-dsfr/Tile'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useCities } from '~/hooks/use-cities'

export const PopularCities: FC = () => {
  const { classes } = useStyles()
  const { data } = useCities()
  const mockDescription = '9 802 logements étudiants'
  const mockDetail = 'Buget minimum 600€'

  return (
    <div className={classes.tilesGrid}>
      {(data || []).map((city) => (
        <Tile
          noIcon
          key={city.id}
          desc={mockDescription}
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
    display: 'grid',
    gap: '1rem',
    gridTemplateColumns: 'repeat(4, 1fr)',
  },
})
