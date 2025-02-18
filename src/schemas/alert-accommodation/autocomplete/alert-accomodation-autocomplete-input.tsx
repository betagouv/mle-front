/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { tss } from 'tss-react'
import { useTerritories } from '~/hooks/use-territories'
import { AlertAccomodationAutocompleteResults } from '~/schemas/alert-accommodation/autocomplete/alert-accomodation-autocomplete-results'

export const AlertAccomodationAutocompleteInput: FC<{ redirect?: boolean }> = ({ redirect = true }) => {
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()

  const { data, isError, searchQuery, setSearchQuery } = useTerritories()
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)
  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault()
  }

  return (
    <div className={classes.container}>
      <Input
        classes={{ root: classes.input }}
        label={t('header.inputLabel')}
        iconId="ri-map-pin-2-line"
        nativeInputProps={{ onBlur: handleInputBlur, onChange: handleInputChange, value: searchQuery }}
        state={isError ? 'error' : 'default'}
      />

      {data && <AlertAccomodationAutocompleteResults data={data} searchQuery={searchQuery} />}
    </div>
  )
}

const useStyles = tss.create({
  container: {
    position: 'relative',
    [fr.breakpoints.down('sm')]: {
      width: '100%',
    },
  },
  input: {
    marginBottom: '0 !important',
  },
})
