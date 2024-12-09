'use client'

import { fr, FrCxArg } from '@codegouvfr/react-dsfr'
import { useTranslations } from 'next-intl'
import { FC } from 'react'
import { tss } from 'tss-react'
import { TTerritories, TTerritory } from '~/schemas/territories'

interface AutocompleteResultsProps {
  data: TTerritories
  onClick: (item: TTerritory) => void
}

export const FindStudentAccomodationAutocompleteResults: FC<AutocompleteResultsProps> = ({ data, onClick }) => {
  const t = useTranslations('findAccomodation')
  const { classes } = useStyles()

  const categories = ['academies', 'cities', 'departments']

  const getCategoryLabelAndIcon = (category: keyof TTerritories): { icon: FrCxArg; label: string } => {
    const labels = {
      academies: { icon: 'ri-bank-fill' as FrCxArg, label: t('autocomplete.categories.academies') },
      cities: { icon: 'ri-community-line' as FrCxArg, label: t('autocomplete.categories.cities') },
      departments: { icon: 'fr-icon-france-line' as FrCxArg, label: t('autocomplete.categories.departments') },
    }
    return labels[category]
  }

  if (!Object.keys(data).length) {
    return null
  }

  return (
    <div className={classes.container}>
      <ul className={classes.list}>
        {categories.map((category) => {
          const categoryKey = category as keyof TTerritories
          const items = data[categoryKey] as TTerritory[]
          if (!items?.length) return null
          const { icon, label } = getCategoryLabelAndIcon(categoryKey)

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
  category: {
    backgroundColor: fr.colors.decisions.background.alt.beigeGrisGalet.default,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },
  categoryItem: {
    paddingBottom: '0.5rem',
    paddingLeft: '0.5rem',
    paddingTop: '0.5rem',
  },
  container: {
    backgroundColor: 'white',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    left: 0,
    position: 'absolute',
    top: '100%',
    width: '100%',
    zIndex: 10,
  },
  item: {
    '&:hover': {
      backgroundColor: '#f0f0f0',
    },
    borderBottom: '1px solid #e0e0e0',
    borderTop: '1px solid #e0e0e0',
    cursor: 'pointer',
    padding: '8px',
  },
  list: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
})
