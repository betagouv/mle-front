/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import { useTranslations } from 'next-intl'
import { parseAsString } from 'nuqs'
import { useQueryStates } from 'nuqs'
import { FC, useState } from 'react'
import { tss } from 'tss-react'
import { useTerritories } from '~/hooks/use-territories'
import { AlertAccomodationAutocompleteResults } from '~/schemas/alert-accommodation/autocomplete/alert-accomodation-autocomplete-results'

export const AlertAccomodationAutocompleteInput: FC = () => {
  const [_queryStates] = useQueryStates({ q: parseAsString, type: parseAsString })

  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()
  const [open, setOpen] = useState(false)
  const { data, isError, searchQuery, setSearchQuery } = useTerritories()
  const handleInputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.preventDefault()
    setOpen(true)
  }
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(event.target.value)

  return (
    <div className={classes.container}>
      <Input
        classes={{ root: classes.input }}
        label={t('header.inputLabel')}
        iconId="ri-map-pin-2-line"
        nativeInputProps={{ onChange: handleInputChange, onFocus: handleInputFocus, value: searchQuery }}
        state={isError ? 'error' : 'default'}
      />

      {open && data && <AlertAccomodationAutocompleteResults onClick={() => setOpen(false)} data={data} searchQuery={searchQuery} />}
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
