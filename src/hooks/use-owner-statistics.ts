import { useQuery } from '@tanstack/react-query'
import { useTRPC } from '~/server/trpc/client'

export type OwnerStatsPeriod = '7d' | '30d' | '90d'

export type ResidenceSort = 'views_desc' | 'views_asc'
export type CitySort = 'searches_desc' | 'searches_asc'

interface UseOwnerStatisticsOptions {
  period: OwnerStatsPeriod
  ownerId?: number
  residencePage: number
  residenceSearch: string
  residenceSort: ResidenceSort
  cityPage: number
  citySearch: string
  citySort: CitySort
}

export function useOwnerStatistics({
  period,
  ownerId,
  residencePage,
  residenceSearch,
  residenceSort,
  cityPage,
  citySearch,
  citySort,
}: UseOwnerStatisticsOptions) {
  const trpc = useTRPC()

  const overview = useQuery(trpc.ownerStatistics.overview.queryOptions({ period, ownerId }))
  const byAccommodation = useQuery(
    trpc.ownerStatistics.byAccommodation.queryOptions({
      period,
      ownerId,
      page: residencePage,
      search: residenceSearch,
      sort: residenceSort,
    }),
  )
  const byCity = useQuery(
    trpc.ownerStatistics.byCity.queryOptions({
      period,
      ownerId,
      page: cityPage,
      search: citySearch,
      sort: citySort,
    }),
  )

  return { overview, byAccommodation, byCity }
}
