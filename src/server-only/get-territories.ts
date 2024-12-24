import { TTerritories } from '~/schemas/territories'

export const getTerritories = async (q: string) => {
  const response = await fetch(`${process.env.API_URL}/territories?q=${q}`)

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving territories')
  }
  const data = await response.json()

  return data as TTerritories
}
