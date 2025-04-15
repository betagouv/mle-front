'use client'

import { FC } from 'react'
import { tss } from 'tss-react'
import { TCity } from '~/schemas/territories'

interface AutocompleteResultsProps {
  data: TCity[]
  onClickItem: (item: TCity) => void
}

export const FindStudentAccommodationCitiesAutocompleteResults: FC<AutocompleteResultsProps> = ({ data, onClickItem }) => {
  const { classes } = useStyles()

  return (
    <div className={classes.container}>
      <ul className={classes.list}>
        {data.map((item: TCity) => (
          <li className={classes.item} key={item.id} onClick={() => onClickItem(item)}>
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
  list: {
    backgroundColor: 'white',
    borderBottom: '1px solid #e0e0e0',
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
})
