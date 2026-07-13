'use client'

import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import { useTranslations } from 'next-intl'
import { parseAsBoolean, parseAsInteger, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useAccomodations } from '~/hooks/use-accomodations'
import { trackEvent } from '~/lib/tracking'

export const FindStudentAccommodationCrousFilter: FC = () => {
  const t = useTranslations('findAccomodation.header')
  const { data } = useAccomodations()
  const counts = data?.crousCounts
  const [queryStates, setQueryStates] = useQueryStates({
    crous: parseAsBoolean,
    page: parseAsInteger,
  })

  return (
    <SegmentedControl
      legend={t('accommodations')}
      segments={[
        {
          nativeInputProps: {
            onChange: () => {
              trackEvent({ category: 'Recherche', action: 'filtre crous', name: 'active' })
              setQueryStates({ crous: true, page: 1 }, { shallow: false })
            },
            checked: !!queryStates.crous,
          },
          label: counts ? `${t('crous')} (${counts.crous})` : t('crous'),
        },
        {
          nativeInputProps: {
            onChange: () => {
              trackEvent({ category: 'Recherche', action: 'filtre crous', name: 'inactive' })
              setQueryStates({ crous: false, page: 1 }, { shallow: false })
            },
            checked: queryStates.crous === false || queryStates.crous === null,
          },
          label: counts ? `${t('others')} (${counts.others})` : t('others'),
        },
      ]}
    />
  )
}
