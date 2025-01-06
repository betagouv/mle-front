'use client'

import { fr } from '@codegouvfr/react-dsfr'
import Link from 'next/link'
import { FC } from 'react'
import { tss } from 'tss-react'
import { TCity } from '~/schemas/territories'

interface AutocompleteResultsProps {
  data: TCity[]
}

export const CitiesAutocompleteResults: FC<AutocompleteResultsProps> = ({ data }) => {
  const { classes } = useStyles()

  return (
    <div className={classes.container}>
      <ul className={classes.list}>
        {data.map((item: TCity) => (
          <Link
            key={item.id}
            href={{
              pathname: `/preparer-sa-vie-etudiante/${item.name}`,
            }}
          >
            <li className={classes.item} key={item.id}>
              {item.name}
            </li>
          </Link>
        ))}
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
