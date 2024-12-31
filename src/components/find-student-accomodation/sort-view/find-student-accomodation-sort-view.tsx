'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Select from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { FC, useMemo } from 'react'
import { parseAsString, useQueryStates } from 'nuqs'
import { tss } from 'tss-react'
import { fr } from '@codegouvfr/react-dsfr'
import { useAccomodations } from '~/hooks/use-accomodations'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

type FindStudentAccomodationSortViewProps = {
  data: TGetAccomodationsResponse
}
export const FindStudentAccomodationSortView: FC<FindStudentAccomodationSortViewProps> = ({ data }) => {
  const [queryStates, setQueryStates] = useQueryStates({
    bbox: parseAsString,
    vue: parseAsString,
  })
  const t = useTranslations('findAccomodation.filters')
  const { data: accomodations } = useAccomodations()
  const accomodationsData = useMemo(() => (queryStates.bbox ? accomodations : data), [accomodations, data, queryStates.bbox])
  const { classes } = useStyles({ hasResults: accomodationsData && accomodationsData.count > 0 })

  return (
    <div className={classes.headerContainer}>
      {accomodationsData && accomodationsData.count > 0 && <h4>{accomodationsData.count} logements</h4>}
      <div className={classes.container}>
        <Select label="" nativeSelectProps={{}}>
          <option disabled hidden defaultValue={t('sortByPrice')} selected>
            {t('sortByPrice')}
          </option>
        </Select>
        <div className={fr.cx('fr-hidden', 'fr-unhidden-md')}>
          <div>
            <Button
              iconId="ri-layout-grid-2-line"
              priority={queryStates.vue === 'grille' ? 'secondary' : 'tertiary'}
              className={classes.button}
              onClick={() => setQueryStates({ vue: 'grille' })}
            >
              {t('grid')}
            </Button>
            <Button
              iconId="ri-road-map-fill"
              priority={queryStates.vue === 'carte' ? 'secondary' : 'tertiary'}
              className={classes.button}
              onClick={() => setQueryStates({ vue: 'carte' })}
            >
              {t('map')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

const useStyles = tss.withParams<{ hasResults?: boolean }>().create(({ hasResults }) => ({
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
  headerContainer: {
    display: 'flex',
    justifyContent: hasResults ? 'space-between' : 'flex-end',
  },
  title: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#e5e7eb',
    borderRadius: '0.25rem',
    height: '2.5rem',
    width: '10.5rem',
  },
}))
