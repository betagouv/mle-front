/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { parseAsFloat, parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const fetchAccomodations = async (
  bbox: string,
  page: number | null,
  isAccessible: string | null,
): Promise<TGetAccomodationsResponse> => {
  const params = new URLSearchParams()
  if (bbox) params.append('bbox', bbox)
  if (page) params.append('page', page.toString())
  if (isAccessible) params.append('is_accessible', isAccessible)
  const response = await fetch(`/api/accommodations${params.size > 0 ? `?${params.toString()}` : ''}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving accomodations')
  }
  return response.json()
}

export const useAccomodations = (initialData?: TGetAccomodationsResponse) => {
  const [queryStates] = useQueryStates({
    accessible: parseAsString,
    page: parseAsInteger,
    xmax: parseAsFloat,
    xmin: parseAsFloat,
    ymax: parseAsFloat,
    ymin: parseAsFloat,
  })
  const { accessible, page, xmax, xmin, ymax, ymin } = queryStates
  const bboxQuery = xmin && ymin && xmax && ymax ? `${xmin},${ymin},${xmax},${ymax}` : ''

  return useQuery<TGetAccomodationsResponse>({
    initialData: bboxQuery || accessible ? undefined : initialData,
    queryFn: () => fetchAccomodations(bboxQuery, page, accessible),
    queryKey: ['accomodations', { bbox: bboxQuery, accessible, page }],
  })
}
