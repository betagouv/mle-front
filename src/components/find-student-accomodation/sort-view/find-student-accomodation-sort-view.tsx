'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Select from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { useQueryState } from 'nuqs'
import { tss } from 'tss-react'
import { fr } from '@codegouvfr/react-dsfr'

export const FindStudentAccomodationSortView: FC = () => {
  const { classes } = useStyles()
  const [viewQuery, setViewQuery] = useQueryState('vue', {
    defaultValue: 'grille',
  })
  const t = useTranslations('findAccomodation.filters')
  return (
    <div className={classes.container}>
      <Select label="" nativeSelectProps={{}}>
        <option disabled hidden selected>
          {t('sortByPrice')}
        </option>
      </Select>
      <div className={fr.cx('fr-hidden', 'fr-unhidden-md')}>
        <div>
          <Button
            iconId="ri-layout-grid-2-line"
            priority={viewQuery === 'grille' ? 'secondary' : 'tertiary'}
            className={classes.button}
            onClick={() => setViewQuery('grille')}
          >
            {t('grid')}
          </Button>
          <Button
            iconId="ri-road-map-fill"
            priority={viewQuery === 'carte' ? 'secondary' : 'tertiary'}
            className={classes.button}
            onClick={() => setViewQuery('carte')}
          >
            {t('map')}
          </Button>
        </div>
      </div>
    </div>
  )
}

const useStyles = tss.create({
  button: {
    borderRadius: '0.25rem',
  },
  container: {
    display: 'flex',
    gap: '1rem',
  },
})
