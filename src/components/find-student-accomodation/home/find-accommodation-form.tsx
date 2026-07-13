'use client'

import Button from '@codegouvfr/react-dsfr/Button'
import Select from '@codegouvfr/react-dsfr/Select'
import { useTranslations } from 'next-intl'
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { FC } from 'react'
import { useForm } from 'react-hook-form'
import { tss } from 'tss-react'
import { FindStudentAccessibleAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-accessible-accomodation-switch'
import { FindStudentColivingAccomodationSwitch } from '~/components/find-student-accomodation/header/find-student-coliving-accomodation'
import { FindStudentAccommodationCitiesAutocompleteInput } from '~/components/find-student-accomodation/home/autocomplete/find-student-accommodations-cities-autocomplete-input'
import { useAccomodations } from '~/hooks/use-accomodations'
import { buildPriceOptions } from '~/lib/accommodations-search-params'
import { trackEvent } from '~/lib/tracking'

export const FindAccommodationForm: FC = () => {
  const t = useTranslations('home')
  const tHeader = useTranslations('findAccomodation.header')
  const { classes } = useStyles()
  const { data } = useAccomodations()

  // Borne haute = max des résultats de la recherche, arrondi à la centaine supérieure.
  const max = data?.maxPrice ? Math.ceil(data.maxPrice / 100) * 100 : undefined

  const [queryStates, setQueryStates] = useQueryStates({
    prix: parseAsInteger,
    q: parseAsString,
    bbox: parseAsString,
    colocation: parseAsBoolean.withDefault(false),
    accessible: parseAsBoolean.withDefault(false),
  })

  const form = useForm({
    values: {
      q: queryStates.q,
      bbox: queryStates.bbox,
      coliving: queryStates.colocation,
      accessible: queryStates.accessible,
    },
  })

  const prix = queryStates.prix
  const priceOptions = buildPriceOptions(max, prix)

  const city = queryStates.q
  const basePath = city ? `/trouver-un-logement-etudiant/ville/${encodeURIComponent(city)}` : '/trouver-un-logement-etudiant'

  const searchParams = new URLSearchParams({
    colocation: form.getValues('coliving') ? 'true' : 'false',
    accessible: form.getValues('accessible') ? 'true' : 'false',
  })
  if (prix != null) searchParams.set('prix', prix.toString())
  // Only include bbox when not navigating to a specific city (city uses boundary polygon instead)
  if (!city) {
    const bbox = form.getValues('bbox')
    if (bbox) searchParams.set('bbox', bbox)
    searchParams.set('vue', 'carte')
  }

  const href = `${basePath}?${searchParams.toString()}`
  return (
    <>
      <FindStudentAccommodationCitiesAutocompleteInput />
      <Select
        label={t('header.rangeLabel')}
        nativeSelectProps={{
          value: prix ?? '',
          onChange: (e) => setQueryStates({ prix: e.target.value ? Number(e.target.value) : null }),
        }}
      >
        <option value="">{tHeader('priceAll')}</option>
        {priceOptions.map((p) => (
          <option key={p} value={p}>
            {tHeader('priceChip', { prix: p })}
          </option>
        ))}
      </Select>
      <div className={classes.switchContainer}>
        <FindStudentColivingAccomodationSwitch />
        <FindStudentAccessibleAccomodationSwitch />
      </div>
      <Button
        size="large"
        iconId="ri-search-line"
        linkProps={{
          href,
          onClick: () =>
            trackEvent({
              category: 'Recherche',
              action: 'recherche logement',
              name: form.getValues('q') || 'Recherche globale',
            }),
        }}
        className={classes.searchButton}
      >
        {t('features.findAccommodation.searchButton')}
      </Button>
    </>
  )
}

const useStyles = tss.create({
  switchContainer: {
    display: 'flex',
    gap: '1rem',
    justifyContent: 'center',
  },
  searchButton: {
    display: 'flex',
    justifyContent: 'center',
    width: '100%',
  },
})
