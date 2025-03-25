import { TCity } from '~/schemas/territories'

export const getCityDetails = async (slug: string): Promise<TCity> => {
  const response = await fetch(`${process.env.API_URL}/territories/cities/${slug.toLowerCase()}/details`, {
    next: { revalidate: 60 * 60 * 24 },
  })

  if (!response.ok) {
    throw new Error(`Error occurred calling API while city with slug: ${slug}`)
  }
  const data = await response.json()

  return data as TCity
}
