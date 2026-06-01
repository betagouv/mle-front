'use client'

import Select from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { parseAsBoolean, parseAsInteger, useQueryStates } from 'nuqs'
import { useAccomodations } from '~/hooks/use-accomodations'
import { buildPriceOptions } from '~/lib/accommodations-search-params'
import { trackEvent } from '~/lib/tracking'

type FindStudentAccommodationPriceProps = {
  pageSize?: number
  widget?: boolean
}

export const FindStudentAccommodationPrice = ({ pageSize, widget }: FindStudentAccommodationPriceProps) => {
  const t = useTranslations('findAccomodation')
  const { data, isLoading } = useAccomodations({ pageSize })

  const step = 50
  const min = data?.minPrice ? Math.floor(data.minPrice / step) * step : undefined
  const max = data?.maxPrice ? Math.ceil(data.maxPrice / 100) * 100 : undefined

  const [queryStates, setQueryStates] = useQueryStates({
    prix: parseAsInteger,
    page: parseAsInteger,
    crous: parseAsBoolean,
  })
  const isCrous = !!queryStates.crous

  const prix = queryStates.prix
  const options = buildPriceOptions(max, prix)

  const handleChange = (value: string) => {
    const nextPrix = value ? Number(value) : null
    trackEvent({ category: 'Recherche', action: 'filtre prix', value: nextPrix ?? 0 })
    setQueryStates({ prix: nextPrix, page: 1 })
  }

  return (
    <Select
      label={t('header.rangeLabel')}
      style={{ width: '180px' }}
      className="fr-mb-0"
      nativeSelectProps={{
        value: prix ?? '',
        disabled: isLoading || (widget && isCrous),
        onChange: (e) => handleChange(e.target.value),
      }}
    >
      <option value="">{t('header.priceAll')}</option>
      {options.map((p) => (
        <option key={p} value={p}>
          {t('header.priceChip', { prix: p })}
        </option>
      ))}
    </Select>
  )
}
