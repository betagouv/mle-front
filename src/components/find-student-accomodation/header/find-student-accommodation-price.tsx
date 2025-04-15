'use client'

import { Range } from '@codegouvfr/react-dsfr/Range'
import { useTranslations } from 'next-intl'
import { parseAsInteger, useQueryState } from 'nuqs'

export const FindStudentAccommodationPrice = () => {
  const t = useTranslations('findAccomodation')
  const [maxPrice, setMaxPrice] = useQueryState('maxPrice', parseAsInteger.withDefault(1000))

  return (
    <Range
      label={t('header.rangeLabel')}
      max={1000}
      min={150}
      hideMinMax
      step={50}
      suffix=" €"
      nativeInputProps={{ value: maxPrice, onChange: (e) => setMaxPrice(Number(e.target.value)) }}
    />
  )
}
