'use client'

import { tss } from 'tss-react'
import { FC, Suspense, useMemo } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import dynamic from 'next/dynamic'
import { useAccomodations } from '~/hooks/use-accomodations'
import { AccomodationCard } from '~/components/find-student-accomodation/card/find-student-accomodation-card'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'
import { MapSkeleton } from '~/components/map/map-skeleton'
import { parseAsFloat, parseAsInteger, parseAsString, useQueryState, useQueryStates } from 'nuqs'

type FindStudentAccomodationResultsProps = {
  initialData: TGetAccomodationsResponse
}
export const FindStudentAccomodationResults: FC<FindStudentAccomodationResultsProps> = ({ initialData }) => {
  const [view] = useQueryState('vue', parseAsString)
  const [page] = useQueryState('page', parseAsInteger)
  const [bbox] = useQueryStates({
    xmax: parseAsFloat,
    xmin: parseAsFloat,
    ymax: parseAsFloat,
    ymin: parseAsFloat,
  })

  const { data = initialData } = useAccomodations(initialData)
  const hasResults = useMemo(() => data.results.features.length > 0, [data])
  const { classes, cx } = useStyles({ hasResults, view })

  const AccomodationsMap = useMemo(
    () =>
      dynamic(() => import('~/components/map/accomodations-map').then((mod) => mod.AccomodationsMap), {
        loading: () => <MapSkeleton height={700} />,
        ssr: false,
      }),
    [],
  )

  const card = (
    <Suspense fallback={<MapSkeleton height={700} />}>
      <AccomodationsMap center={[46.227638, 2.213749]} />
    </Suspense>
  )
  return (
    <div className={classes.container}>
      <div className={classes.accomodationsContainer}>
        <div className={fr.cx('fr-hidden-sm')}>{card}</div>
        <div className={classes.accommodationGrid}>
          {(data?.results.features || initialData.results.features).map((accommodation) => (
            <AccomodationCard key={accommodation.id} accomodation={accommodation} />
          ))}
        </div>

        {data && data.count > data.page_size && (
          <div className={classes.paginationContainer}>
            <Pagination
              showFirstLast={false}
              count={Math.ceil(data.count / data.page_size)}
              defaultPage={page ?? 1}
              getPageLinkProps={(page: number) => {
                const params = new URLSearchParams()
                if (view) params.set('vue', view)
                if (bbox?.xmin && bbox?.ymin && bbox?.xmax && bbox?.ymax) {
                  params.set('bbox', `${bbox.xmin},${bbox.ymin},${bbox.xmax},${bbox.ymax}`)
                }
                params.set('page', page.toString())
                return { href: `/trouver-un-logement-etudiant?${params.toString()}` }
              }}
            />
          </div>
        )}
      </div>

      {view === 'carte' && (
        <div className={cx(fr.cx('fr-col-md-5', 'fr-pl-5v', 'fr-hidden', 'fr-unhidden-sm'), classes.mapContainer)}>{card}</div>
      )}
    </div>
  )
}

const useStyles = tss.withParams<{ hasResults?: boolean; view: string | null }>().create(({ hasResults = false, view }) => ({
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
    marginBottom: '2rem',
    maxWidth: view === 'carte' ? '60%' : '100%',
    paddingRight: view === 'carte' ? '5v' : '0',
    width: view === 'carte' ? '60%' : '100%',
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  mapContainer: {
    height: hasResults ? 'calc(100vh - 700px)' : 'auto',
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
