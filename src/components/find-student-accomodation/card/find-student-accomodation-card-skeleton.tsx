'use client'

import { FC } from 'react'
import { tss } from 'tss-react'

export const AccomodationCardSkeleton: FC = () => {
  const { classes } = useStyles()

  return (
    <div className={classes.card}>
      <div className={classes.image} />
      <div className={classes.content}>
        <div className={classes.title} />
        <div className={classes.text} />
        <div className={classes.text} />
      </div>
    </div>
  )
}

const useStyles = tss.create({
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '0.5rem',
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    overflow: 'hidden',
  },
  content: {
    padding: '1rem',
  },
  image: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#e5e7eb',
    height: '200px',
    width: '100%',
  },
  text: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#e5e7eb',
    borderRadius: '0.25rem',
    height: '1rem',
    marginTop: '0.5rem',
    width: '100%',
  },
  title: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#e5e7eb',
    borderRadius: '0.25rem',
    height: '1.5rem',
    width: '60%',
  },
})
