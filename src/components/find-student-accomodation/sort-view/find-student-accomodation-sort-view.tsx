'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Select from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { useQueryState } from 'nuqs'
import { tss } from 'tss-react'
import { fr } from '@codegouvfr/react-dsfr'
import { useAccomodations } from '~/hooks/use-accomodations'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

type FindStudentAccomodationSortViewProps = {
  initialData: TGetAccomodationsResponse
}
export const FindStudentAccomodationSortView: FC<FindStudentAccomodationSortViewProps> = ({ initialData }) => {
  const { classes } = useStyles()
  const [viewQuery, setViewQuery] = useQueryState('vue', {
    defaultValue: 'grille',
  })
  const t = useTranslations('findAccomodation.filters')
  const { data, isPending } = useAccomodations(initialData)
  return (
    <>
      {isPending ? <div className={classes.title} /> : <h4>{data?.count} logements</h4>}
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
    </>
  )
}

const useStyles = tss.create({
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
  button: {
    borderRadius: '0.25rem',
  },
  container: {
    display: 'flex',
    gap: '1rem',
  },
  title: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#e5e7eb',
    borderRadius: '0.25rem',
    height: '2.5rem',
    width: '10.5rem',
  },
})
