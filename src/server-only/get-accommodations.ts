import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const getAccommodations = async (searchParams: {
  accessible?: string
  bbox?: string
  center?: string
  hasColiving?: string
  maxPrice?: string
  page?: string
}) => {
  const params = new URLSearchParams()
  if (searchParams.page) params.append('page', searchParams.page)
  if (searchParams.bbox) params.append('bbox', searchParams.bbox)
  if (searchParams.center) {
    params.append('center', searchParams.center)
    params.append('radius', '5')
  }
  if (searchParams.accessible) params.append('is_accessible', searchParams.accessible)
  if (searchParams.hasColiving) params.append('has_coliving', searchParams.hasColiving)
  if (searchParams.maxPrice) params.append('price_max', searchParams.maxPrice)

  const response = await fetch(`${process.env.API_URL}/accommodations${params.size > 0 ? `?${params.toString()}` : ''}`, {
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving accommodations')
  }
  const data = await response.json()

  return data as TGetAccomodationsResponse
}
