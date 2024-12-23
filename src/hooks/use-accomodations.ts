/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { parseAsFloat, parseAsInteger, useQueryStates } from 'nuqs'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const fetchAccomodations = async (bbox: string, page: number | null): Promise<TGetAccomodationsResponse> => {
  const params = new URLSearchParams()
  if (bbox) params.append('bbox', bbox)
  if (page) params.append('page', page.toString())
  const response = await fetch(`/api/accommodations${params.size > 0 ? `?${params.toString()}` : ''}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving accomodations')
  }
  return response.json()
}

export const useAccomodations = (initialData?: TGetAccomodationsResponse) => {
  const [queryStates] = useQueryStates({
    page: parseAsInteger,
    xmax: parseAsFloat,
    xmin: parseAsFloat,
    ymax: parseAsFloat,
    ymin: parseAsFloat,
  })
  const { page, xmax, xmin, ymax, ymin } = queryStates
  const bboxQuery = xmin && ymin && xmax && ymax ? `${xmin},${ymin},${xmax},${ymax}` : ''

  return useQuery<TGetAccomodationsResponse>({
    initialData: bboxQuery ? undefined : initialData,
    queryFn: () => fetchAccomodations(bboxQuery, page),
    queryKey: ['accomodations', bboxQuery, page],
    staleTime: 1000 * 60,
  })
}
