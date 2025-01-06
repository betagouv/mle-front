/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const fetchAccomodations = async (
  bbox: string | null,
  page: number | null,
  isAccessible: string | null,
  hasColiving: string | null,
): Promise<TGetAccomodationsResponse> => {
  const params = new URLSearchParams()
  if (bbox) params.append('bbox', bbox)
  if (page) params.append('page', page.toString())
  if (isAccessible) params.append('is_accessible', isAccessible)
  if (hasColiving) params.append('has_coliving', hasColiving)
  const response = await fetch(`/api/accommodations${params.size > 0 ? `?${params.toString()}` : ''}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving accomodations')
  }
  return response.json()
}

export const useAccomodations = () => {
  const [queryStates] = useQueryStates({
    accessible: parseAsString,
    bbox: parseAsString,
    coliving: parseAsString,
    page: parseAsInteger,
  })
  const { accessible, bbox, coliving, page } = queryStates

  const enabled = !!bbox || !!accessible || !!page || !!coliving
  return useQuery<TGetAccomodationsResponse>({
    enabled,
    queryFn: () => fetchAccomodations(bbox, page, accessible, coliving),
    queryKey: ['accomodations', { accessible, bbox, coliving, page }],
  })
}
