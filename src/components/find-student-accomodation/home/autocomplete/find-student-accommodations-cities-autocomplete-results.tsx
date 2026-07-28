'use client'

import clsx from 'clsx'
import { FC, HTMLAttributes, LiHTMLAttributes } from 'react'
import { tss } from 'tss-react'
import { TCity } from '~/schemas/territories'

interface AutocompleteResultsProps {
  data: TCity[]
  /** Fourni par useCombobox : rôle et identifiant de la liste. */
  listboxProps: HTMLAttributes<HTMLUListElement>
  /** Fourni par useCombobox : rôle, identifiant, état sélectionné et activation de chaque option. */
  getOptionProps: (index: number) => LiHTMLAttributes<HTMLLIElement>
  /** Option désignée par aria-activedescendant, à mettre en évidence visuellement. */
  activeIndex: number
}

export const FindStudentAccommodationCitiesAutocompleteResults: FC<AutocompleteResultsProps> = ({
  data,
  listboxProps,
  getOptionProps,
  activeIndex,
}) => {
  const { classes } = useStyles()

  return (
    <div className={classes.container}>
      <ul className={classes.list} {...listboxProps}>
        {data.map((item: TCity, index) => (
          <li key={item.id} className={clsx(classes.item, index === activeIndex && classes.itemActive)} {...getOptionProps(index)}>
            {item.name}
          </li>
        ))}
      </ul>
    </div>
  )
}

const useStyles = tss.create({
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
  itemActive: {
    backgroundColor: '#f0f0f0',
  },
  list: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
})
