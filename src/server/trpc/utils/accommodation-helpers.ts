import slugify from 'slugify'
import { resolveAddressLocation } from '~/server/lib/geocoding/resolve'

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

/**
 * Géocode une adresse saisie par un bailleur. Renvoie `null` quand aucun
 * candidat ne peut être rattaché avec certitude à la commune du code postal :
 * mieux vaut pas de coordonnées qu'un point dans un autre département.
 */
export async function geocodeAddress(address: string, city: string, postalCode: string): Promise<{ lon: number; lat: number } | null> {
  const decision = await resolveAddressLocation({ address, postalCode, cityName: city })
  if (decision.action !== 'apply') return null
  return { lon: decision.lng, lat: decision.lat }
}
