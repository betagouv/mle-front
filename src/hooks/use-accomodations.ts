/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery } from '@tanstack/react-query'
import { parseAsFloat, useQueryStates } from 'nuqs'
import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const fetchAccomodations = async (bbox: string): Promise<TGetAccomodationsResponse> => {
  const response = await fetch(`/api/accommodations${bbox ? `?bbox=${bbox}` : ''}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving accomodations')
  }
  return response.json()
}

export const useAccomodations = () => {
  const [bbox] = useQueryStates({
    xmax: parseAsFloat,
    xmin: parseAsFloat,
    ymax: parseAsFloat,
    ymin: parseAsFloat,
  })
  const { xmax, xmin, ymax, ymin } = bbox
  const bboxQuery = xmin && ymin && xmax && ymax ? `${xmin},${ymin},${xmax},${ymax}` : ''

  const { data, isError, isLoading } = useQuery<TGetAccomodationsResponse>({
    queryFn: () => fetchAccomodations(bboxQuery),
    queryKey: ['accomodations', bboxQuery],
  })

  return {
    data,
    isError,
    isLoading,
  }
}
