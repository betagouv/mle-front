'use client'

import { RadioButtons } from '@codegouvfr/react-dsfr/RadioButtons'
import { useTranslations } from 'next-intl'
import { parseAsBoolean, parseAsInteger, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useAccomodations } from '~/hooks/use-accomodations'
import { trackEvent } from '~/lib/tracking'
import styles from './find-student-accommodation-crous-filter.module.css'

export const FindStudentAccommodationCrousFilter: FC = () => {
  const t = useTranslations('findAccomodation.header')
  const { data } = useAccomodations()
  const counts = data?.crousCounts
  const [queryStates, setQueryStates] = useQueryStates({
    crous: parseAsBoolean,
    page: parseAsInteger,
  })

  return (
    <RadioButtons
      className={styles.filter}
      legend={t('accommodations')}
      orientation="horizontal"
      options={[
        {
          label: counts ? `${t('crous')} (${counts.crous})` : t('crous'),
          nativeInputProps: {
            checked: !!queryStates.crous,
            onChange: () => {
              trackEvent({ category: 'Recherche', action: 'filtre crous', name: 'active' })
              setQueryStates({ crous: true, page: 1 }, { shallow: false })
            },
          },
        },
        {
          label: counts ? `${t('others')} (${counts.others})` : t('others'),
          nativeInputProps: {
            checked: queryStates.crous === false || queryStates.crous === null,
            onChange: () => {
              trackEvent({ category: 'Recherche', action: 'filtre crous', name: 'inactive' })
              setQueryStates({ crous: false, page: 1 }, { shallow: false })
            },
          },
        },
      ]}
    />
  )
}
