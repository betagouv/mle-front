import proj4 from 'proj4'

/**
 * Utilitaires géographiques : distance géodésique (haversine) et reprojection
 * Lambert 93 (EPSG:2154) → WGS84 (EPSG:4326).
 *
 * Le reste du projet délègue la géo à PostGIS ; ces fonctions servent au calcul
 * de distance côté service (couche testable sans base) pour les établissements
 * RAMSESE, dont les coordonnées sont fournies sous forme de chaînes x/y avec un
 * système de référence variable.
 */

export type TLatLng = { lat: number; lng: number }

// proj4 n'embarque que EPSG:4326 et EPSG:3857 : on enregistre Lambert 93.
const LAMBERT_93 =
  '+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs'
proj4.defs('EPSG:2154', LAMBERT_93)

const EARTH_RADIUS_M = 6_371_000
const toRad = (deg: number) => (deg * Math.PI) / 180

/** Distance géodésique en mètres entre deux points WGS84 (formule de haversine). */
export function haversineMeters(a: TLatLng, b: TLatLng): number {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)

  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)))
}

/** Reprojette un point Lambert 93 (x = easting, y = northing, en mètres) vers WGS84. */
export function lambert93ToWgs84(x: number, y: number): TLatLng {
  const [lng, lat] = proj4('EPSG:2154', 'EPSG:4326', [x, y])
  return { lat, lng }
}

/**
 * Normalise les coordonnées d'un établissement RAMSESE en WGS84.
 *
 * `systemeReference` conditionne l'interprétation de x/y :
 * - WGS84 / 4326          → x = longitude, y = latitude (aucune reprojection)
 * - Lambert 93 / 2154 / ∅ → x/y en mètres, reprojetés (défaut métropole)
 *
 * Renvoie `null` si x ou y ne sont pas numériques.
 */
export function parseRamseseCoordonnees(coordonnees: { x: string; y: string; systemeReference: string | null }): TLatLng | null {
  // Number('') vaut 0 (fini) : on rejette d'abord les chaînes vides/blanches.
  if (coordonnees.x.trim() === '' || coordonnees.y.trim() === '') return null
  const x = Number(coordonnees.x)
  const y = Number(coordonnees.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null

  const ref = (coordonnees.systemeReference ?? '').toUpperCase()
  const isWgs84 = ref.includes('WGS') || ref.includes('4326')

  return isWgs84 ? { lat: y, lng: x } : lambert93ToWgs84(x, y)
}
