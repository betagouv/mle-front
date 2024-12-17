import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const getAccommodations = async (searchParams: { bbox?: string; page?: string }) => {
  const params = new URLSearchParams()
  if (searchParams.page) params.append('page', searchParams.page)
  if (searchParams.bbox) params.append('bbox', searchParams.bbox)
  const response = await fetch(`${process.env.API_URL}/accommodations${params.size > 0 ? `?${params.toString()}` : ''}`)

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving accommodations')
  }
  const data = await response.json()

  return data as TGetAccomodationsResponse
}
