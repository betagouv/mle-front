'use client'

import { fr } from '@codegouvfr/react-dsfr'
import { Pagination } from '@codegouvfr/react-dsfr/Pagination'
import { useTranslations } from 'next-intl'
import dynamic from 'next/dynamic'
import { parseAsInteger, parseAsString, useQueryState } from 'nuqs'
import { FC, Suspense, useEffect, useMemo } from 'react'
import { tss } from 'tss-react'
import { AccomodationCard } from '~/components/find-student-accomodation/card/find-student-accomodation-card'
import { MapSkeleton } from '~/components/map/map-skeleton'
import { CardSkeleton } from '~/components/ui/skeleton/card-skeleton'
import { useAccomodations } from '~/hooks/use-accomodations'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'
import { TTerritory } from '~/schemas/territories'

type FindStudentAccomodationResultsProps = {
  data: TGetAccomodationsResponse
  territory?: TTerritory
}
export const FindStudentAccomodationResults: FC<FindStudentAccomodationResultsProps> = ({ data, territory }) => {
  const t = useTranslations('findAccomodation.results')
  const [view] = useQueryState('vue', parseAsString)
  const [page] = useQueryState('page', parseAsInteger)
  const [bboxQuery, setBboxQuery] = useQueryState('bbox', parseAsString)

  useEffect(() => {
    if (territory && territory.bbox) {
      setBboxQuery(`${territory.bbox.xmin},${territory.bbox.ymin},${territory.bbox.xmax},${territory.bbox.ymax}`)
    }
  }, [])

  const { data: accommodations, isLoading } = useAccomodations({ initialData: data })

  useEffect(() => {
    if (!!accommodations?.results?.features && accommodations.results.features.length < 6) {
      window.scrollTo({ behavior: 'smooth', top: 0 })
    }
  }, [accommodations?.results.features.length])

  const { classes, cx } = useStyles({ view })

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
      <AccomodationsMap data={data} />
    </Suspense>
  )

  return (
    <>
      <div className={fr.cx('fr-hidden-sm')}>{card}</div>
      <div className={classes.container}>
        <div className={classes.accomodationsContainer}>
          <div className={classes.accommodationGrid}>
            {!isLoading &&
              (accommodations?.results.features || []).map((accommodation) => (
                <AccomodationCard key={accommodation.id} accomodation={accommodation} />
              ))}
            {isLoading && Array.from({ length: 24 }).map((_, index) => <CardSkeleton key={index} />)}
          </div>
          <div>
            {accommodations?.count === 0 && (
              <div>
                <h3>{t('noResult')}</h3>
                <p>{t('description')}</p>
              </div>
            )}
          </div>

          {accommodations && accommodations.count > accommodations.page_size && (
            <div className={classes.paginationContainer}>
              <Pagination
                showFirstLast={false}
                count={Math.ceil(accommodations.count / accommodations.page_size)}
                defaultPage={page ?? 1}
                getPageLinkProps={(page: number) => {
                  const params = new URLSearchParams()
                  if (view) params.set('vue', view)
                  if (bboxQuery) {
                    params.set('bbox', `${bboxQuery}`)
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
    </>
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
    [fr.breakpoints.up('md')]: {
      flex: view === 'carte' ? '0 0 60%' : '0 0 100%',
      marginBottom: '2rem',
      maxWidth: view === 'carte' ? '60%' : '100%',
      width: view === 'carte' ? '60%' : '100%',
    },
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  mapContainer: {
    [fr.breakpoints.up('md')]: {
      '@media (min-height: 900px)': {
        height: 'calc(100vh - 400px)',
      },
      '@media (min-height: 700px) and (max-height: 899px)': {
        height: 'calc(100vh - 300px)',
      },
      '@media (min-height: 500px) and (max-height: 699px)': {
        height: '400px',
      },
      '@media (max-height: 499px)': {
        height: '300px',
      },
    },
    '@media (max-height: 499px)': {
      height: '300px',
    },
    height: 'calc(100vh - 600px)',
    minHeight: '300px',
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
