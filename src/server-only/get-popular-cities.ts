import { TCity } from '~/schemas/territories'

export const getPopularCities = async (): Promise<TCity[]> => {
  const response = await fetch(`${process.env.API_URL}/territories/cities/?popular=true`, { next: { revalidate: 60 * 60 * 24 } })

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving territories')
  }
  const data = await response.json()

  return data.sort((a: TCity, b: TCity) => a.name.localeCompare(b.name)) as TCity[]
}
