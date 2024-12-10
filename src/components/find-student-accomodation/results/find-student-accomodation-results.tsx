'use client'

import { tss } from 'tss-react'
import { AccomodationCard } from '~/components/find-student-accomodation/card/find-student-accomodation-card'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { FC, useMemo } from 'react'
import { useQueryState } from 'nuqs'
import { fr } from '@codegouvfr/react-dsfr'
import dynamic from 'next/dynamic'
import { mockAccomodationCards } from '~/app/mocks/mock-accomodations'

export const FindStudentAccomodationResults: FC = () => {
  const AccomodationsMap = useMemo(
    () =>
      dynamic(() => import('~/components/map/accomodations-map').then((mod) => mod.AccomodationsMap), {
        loading: () => <p>Loading map...</p>,
        ssr: false,
      }),
    [],
  )

  const [view] = useQueryState('vue')

  const { classes, cx } = useStyles({ view })

  return (
    <div className={classes.container}>
      <div className={classes.accomodationsContainer}>
        <div className={classes.accommodationGrid}>
          {mockAccomodationCards.map((card) => (
            <AccomodationCard key={card.title} {...card} />
          ))}
        </div>

        <div className={classes.paginationContainer}>
          <Pagination showFirstLast={false} count={10} defaultPage={1} getPageLinkProps={() => ({ href: '/' })} />
        </div>
      </div>
      {view === 'carte' && (
        <div className={cx(fr.cx('fr-col-md-5', 'fr-pl-5v'), classes.mapContainer)}>
          <AccomodationsMap center={[46.227638, 2.213749]} />
        </div>
      )}
    </div>
  )
}

const useStyles = tss.withParams<{ view: string | null }>().create(({ view }) => ({
  accommodationGrid: {
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: view === 'carte' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
  },
  accomodationsContainer: {
    flex: view === 'carte' ? '0 0 60%' : '0 0 100%',
    maxWidth: view === 'carte' ? '60%' : '100%',
    paddingRight: view === 'carte' ? '5v' : '0',
    width: view === 'carte' ? '60%' : '100%',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  mapContainer: {
    height: 'calc(100vh - 700px)',
    position: 'sticky',
    top: '1rem',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: '2rem',
    paddingTop: '2rem',
  },
}))
