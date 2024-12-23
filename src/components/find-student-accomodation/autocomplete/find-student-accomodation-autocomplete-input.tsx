'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Input from '@codegouvfr/react-dsfr/Input'
import { useTranslations } from 'next-intl'
import { useQueryState } from 'nuqs'
import { FC, useState } from 'react'
import { tss } from 'tss-react'
import { FindStudentAccomodationAutocompleteResults } from '~/components/find-student-accomodation/autocomplete/find-student-accomodation-autocomplete-results'
import { useTerritories } from '~/hooks/use-territories'
import { TTerritory } from '~/schemas/territories'

export const FindStudentAccomodationAutocompleteInput: FC = () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setBbox] = useQueryState('bbox')
  const [resultsOpen, setResultsOpen] = useState(false)
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()
  const { data, isError, searchQuery, setSearchQuery } = useTerritories()

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value)
    setResultsOpen(true)
  }

  const handleInputClick = (item: TTerritory) => {
    setSearchQuery(item.name)
    setResultsOpen(false)
    setBbox(`${item.bbox.xmin},${item.bbox.ymin},${item.bbox.xmax},${item.bbox.ymax}`)
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

      {data && <FindStudentAccomodationAutocompleteResults open={resultsOpen} onClick={handleInputClick} data={data} />}
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
