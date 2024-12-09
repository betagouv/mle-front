/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { fr, FrCxArg } from '@codegouvfr/react-dsfr'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { tss } from 'tss-react'
import { TTerritories, TTerritory } from '~/schemas/territories'

interface AutocompleteResultsProps {
  data: TTerritories[]
  onClick: (item: TTerritory) => void
}

type CategoryKey = keyof TTerritories

export const FindStudentAccomodationAutocompleteResults: FC<AutocompleteResultsProps> = ({ data, onClick }) => {
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()

  const categories: CategoryKey[] = ['academies', 'cities', 'departments']

  const getCategoryLabelAndIcon = (category: CategoryKey): { label: string; icon: FrCxArg } => {
    const labels = {
      academies: { label: t('autocomplete.categories.academies'), icon: 'ri-bank-fill' as FrCxArg },
      cities: { label: t('autocomplete.categories.cities'), icon: 'ri-community-line' as FrCxArg },
      departments: { label: t('autocomplete.categories.departments'), icon: 'fr-icon-france-line' as FrCxArg },
    }
    return labels[category]
  }

  if (!Object.keys(data).length) {
    return null
  }

  return (
    <div className={classes.container}>
      <ul className={classes.list}>
        {categories.map((category: any) => {
          const items = data[category] as any
          if (!items?.length) return null
          const { label, icon } = getCategoryLabelAndIcon(category)

          return (
            <div className={classes.category} key={category}>
              <li className={classes.categoryItem}>
                <span className={fr.cx(icon)}>{label}</span>
              </li>
              <ul className={classes.list}>
                {items.map((item: TTerritory) => (
                  <li className={classes.item} key={item.id} onClick={() => onClick(item)} tabIndex={0}>
                    {item.name}
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </ul>
    </div>
  )
}

const useStyles = tss.create({
  container: {
    backgroundColor: 'white',
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    zIndex: 10,
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
  },
  category: {
    backgroundColor: fr.colors.decisions.background.alt.beigeGrisGalet.default,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  categoryItem: {
    paddingTop: '0.5rem',
    paddingBottom: '0.5rem',
    paddingLeft: '0.5rem',
  },
  list: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
  },
  item: {
    cursor: 'pointer',
    padding: '8px',
    borderBottom: '1px solid #e0e0e0',
    borderTop: '1px solid #e0e0e0',
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
  },
})
