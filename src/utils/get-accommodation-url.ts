export function getAccommodationPath(cityName: string, slug: string): string {
  return `/trouver-un-logement-etudiant/ville/${encodeURIComponent(cityName)}/${slug}`
}
