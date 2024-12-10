import { TGetAccomodationsResponse } from '~/schemas/accommodations/get-accommodations'

export const getAccommodations = async () => {
  const response = await fetch(`${process.env.API_URL}/accommodations`)

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving accommodations')
  }
  const data = await response.json()

  return data as TGetAccomodationsResponse
}
