import slugify from 'slugify'
import { env } from '~/server/env'

slugify.extend({
  '&': 'et',
  "'": '-',
  '\u2019': '-',
  ' : ': '-',
  ':': '-',
  '"': '',
  '.': '-',
  '\u275D': '',
  '\u275E': '',
  '\u201C': '',
  '\u201D': '',
  '\u00AB': '',
  '\u00BB': '',
  '(': '',
  ')': '',
  '[': '',
  ']': '',
  '{': '',
  '}': '',
  '\u00BF': '',
  '?': '',
  '!': '',
  '/': '',
  '\\': '',
  ',': '-',
  ';': '-',
  '<': '',
  '>': '',
  '@': '-',
  '*': '',
  '+': ' plus ',
})

export function generateSlug(name: string): string {
  return slugify(name, { lower: true })
}

export async function geocodeAddress(address: string, city: string, postalCode: string): Promise<{ lon: number; lat: number } | null> {
  const query = `${address} ${postalCode} ${city}`
  const baseUrl = env.GEOCODING_API_URL
  const url = `${baseUrl}?q=${encodeURIComponent(query)}&limit=1`

  try {
    const response = await fetch(url)
    if (!response.ok) return null

    const data = await response.json()
    const feature = data?.features?.[0]
    if (!feature?.geometry?.coordinates) return null

    const [lon, lat] = feature.geometry.coordinates
    return { lon, lat }
  } catch {
    return null
  }
}
