import { TAccomodationDetails } from '~/schemas/accommodations/accommodations'

export const getAccommodationById = async (slug: string) => {
  const response = await fetch(`${process.env.API_URL}/accommodations/${slug}/`)

  if (!response.ok) {
    throw new Error(`Error occurred calling API while retrieving accommodation with slug: ${slug}`)
  }
  const data = await response.json()

  return data as TAccomodationDetails
}
