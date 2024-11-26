'use client'

import Input from '@codegouvfr/react-dsfr/Input'
import { useTranslations } from 'next-intl'
import { tss } from 'tss-react'
import { FindStudentAccomodationAutocompleteResults } from '~/components/find-student-accomodation/autocomplete/find-student-accomodation-autocomplete-results'
import { useTerritories } from '~/hooks/use-territories'
import { TTerritory } from '~/schemas/territories'

export const FindStudentAccomodationAutocompleteInput = () => {
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()
  const { data, isError, searchQuery, setSearchQuery } = useTerritories()

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
  }

  const handleInputClick = (item: TTerritory) => {
    setSearchQuery(item.name)
  }
  return (
    <div className={classes.container}>
      <Input
        classes={{ root: classes.input }}
        label={t('header.inputLabel')}
        iconId="ri-map-pin-2-line"
        nativeInputProps={{ onChange: handleInputChange, value: searchQuery }}
        state={isError ? 'error' : 'default'}
      />
      {data && <FindStudentAccomodationAutocompleteResults onClick={handleInputClick} data={data} />}
    </div>
  )
}

const useStyles = tss.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  input: {
    marginBottom: '0 !important',
  },
})
