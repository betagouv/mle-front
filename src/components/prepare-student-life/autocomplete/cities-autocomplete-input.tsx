/* eslint-disable @typescript-eslint/no-unused-vars */
'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { tss } from 'tss-react'
import { CitiesAutocompleteResults } from '~/components/prepare-student-life/autocomplete/cities-autocomplete-results'
import { useCities } from '~/hooks/use-cities'

export const CitiesAutocompleteInput: FC = () => {
  const t = useTranslations('prepareStudentLife')
  const { classes } = useStyles()
  const { data, isError, searchQuery, setSearchQuery } = useCities()
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  return (
    <div className={classes.container}>
      <Input
        classes={{ root: classes.input }}
        label={t('city')}
        iconId="ri-search-line"
        nativeInputProps={{ onChange: handleInputChange, value: searchQuery }}
        state={isError ? 'error' : 'default'}
      />

      {data && <CitiesAutocompleteResults data={data} />}
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
