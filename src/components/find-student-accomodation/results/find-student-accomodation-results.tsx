'use client'

import { tss } from 'tss-react'
import { FC, Suspense, useMemo } from 'react'
import { useQueryState } from 'nuqs'
import { fr } from '@codegouvfr/react-dsfr'
import dynamic from 'next/dynamic'
import { useAccomodations } from '~/hooks/use-accomodations'
import { AccomodationCard } from '~/components/find-student-accomodation/card/find-student-accomodation-card'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { AccomodationCardSkeleton } from '~/components/find-student-accomodation/card/find-student-accomodation-card-skeleton'

const MapSkeleton: FC = () => {
  const { classes } = useStyles({ view: 'carte' })
  return <div className={classes.mapSkeleton} />
}

export const FindStudentAccomodationResults: FC = () => {
  const [view] = useQueryState('vue')
  const { classes, cx } = useStyles({ view })
  const { data, isLoading } = useAccomodations()

  const AccomodationsMap = useMemo(
    () =>
      dynamic(() => import('~/components/map/accomodations-map').then((mod) => mod.AccomodationsMap), {
        loading: () => <MapSkeleton />,
        ssr: false,
      }),
    [],
  )
  const skeletons = (
    <div className={classes.accomodationsContainer}>
      <div className={classes.accommodationGrid}>
        {Array.from({ length: 6 }).map((_, i) => (
          <AccomodationCardSkeleton key={i} />
        ))}
      </div>
    </div>
  )

  const card = (
    <Suspense fallback={<MapSkeleton />}>
      <AccomodationsMap center={[46.227638, 2.213749]} />
    </Suspense>
  )

  return (
    <div className={classes.container}>
      {isLoading ? (
        skeletons
      ) : (
        <div className={classes.accomodationsContainer}>
          <div className={fr.cx('fr-hidden-sm')}>{card}</div>
          <div className={classes.accommodationGrid}>
            {(data?.results.features || []).map((accommodation) => (
              <AccomodationCard key={accommodation.id} {...accommodation} />
            ))}
          </div>

          {data && data.count > data.page_size && (
            <div className={classes.paginationContainer}>
              <Pagination
                showFirstLast={false}
                count={Math.ceil(data.count / data.page_size)}
                defaultPage={1}
                getPageLinkProps={() => ({ href: '/' })}
              />
            </div>
          )}
        </div>
      )}

      {view === 'carte' && (
        <div className={cx(fr.cx('fr-col-md-5', 'fr-pl-5v', 'fr-hidden', 'fr-unhidden-sm'), classes.mapContainer)}>{card}</div>
      )}
    </div>
  )
}

const useStyles = tss.withParams<{ view: string | null }>().create(({ view }) => ({
  '@keyframes pulse': {
    '0%, 100%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
  },
  accommodationGrid: {
    [fr.breakpoints.up('md')]: {
      gridTemplateColumns: view === 'carte' ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
    },
    display: 'grid',
    gap: '2rem',
    gridTemplateColumns: '1fr',
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
  mapSkeleton: {
    animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    backgroundColor: '#e5e7eb',
    height: '700px',
    width: '100%',
  },
  paginationContainer: {
    display: 'flex',
    justifyContent: 'center',
    paddingBottom: '2rem',
    paddingTop: '2rem',
  },
}))
