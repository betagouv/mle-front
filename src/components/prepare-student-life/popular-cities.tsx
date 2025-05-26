'use client'

import Alert from '@codegouvfr/react-dsfr/Alert'
import Tile from '@codegouvfr/react-dsfr/Tile'
import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useCities } from '~/hooks/use-cities'
import { TCity } from '~/schemas/territories'
import { sPluriel } from '~/utils/sPluriel'

interface PopularCitiesProps {
  cities: TCity[]
}

export const PopularCities: FC<PopularCitiesProps> = ({ cities }) => {
  const { classes } = useStyles()
  const t = useTranslations('prepareStudentLife')
  const [departmentQuery] = useQueryState('department')

  const { data, isLoading } = useCities()

  if (isLoading) return null

  if (data?.length === 0) return <Alert severity="info" title={t('noResultTitle')} description={t('noResultDescription')} />
  const sortedCities = data?.sort((a: TCity, b: TCity) => a.name.localeCompare(b.name))
  console.log(sortedCities, cities)
  return (
    <>
      {!departmentQuery && (
        <div className={classes.popularCitiesTitle}>
          <h3>{t('popularCities')}</h3>
        </div>
      )}
      <div className={classes.tilesGrid}>
        {(sortedCities || cities).map((city) => {
          const desc = !!city.nb_total_apartments && `${city.nb_total_apartments} logement${sPluriel(city.nb_total_apartments)} étudiants`
          return (
            <Tile
              noIcon
              key={city.id}
              desc={desc}
              detail={city.price_min ? `Budget minimum ${city.price_min}€` : undefined}
              linkProps={{
                href: `/preparer-sa-vie-etudiante/${city.slug}`,
              }}
              orientation="vertical"
              title={city.name}
              titleAs="h3"
              classes={{ root: classes.tileContainer }}
            />
          )
        })}
      </div>
    </>
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
  tileContainer: {
    height: '160px',
  },
  popularCitiesTitle: {
    color: '#666666',
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
})
