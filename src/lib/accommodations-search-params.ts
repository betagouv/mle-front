import { createSearchParamsCache, parseAsBoolean, parseAsInteger, parseAsString } from 'nuqs/server'

export const accommodationsParsers = {
  academie: parseAsString,
  accessible: parseAsBoolean,
  bbox: parseAsString,
  colocation: parseAsBoolean,
  disponible: parseAsBoolean,
  gestionnaire: parseAsString,
  page: parseAsInteger,
  prix: parseAsInteger,
  crous: parseAsBoolean,
}

export const accommodationsSearchParamsCache = createSearchParamsCache(accommodationsParsers)

// Filtre budget (menu déroulant), en euros.
export const PRICE_FILTER_STEP = 100 // pas entre deux paliers
export const PRICE_FILTER_MIN = 300 // palier plancher
// Paliers par défaut quand le max des résultats n'est pas connu (chargement / pas de résultats).
export const PRICE_FILTER_OPTIONS = [600, 500, 400, 300] as const

// Construit la liste des options du menu budget (ordre décroissant) :
// - tous les paliers de PRICE_FILTER_STEP en PRICE_FILTER_STEP, du max des résultats jusqu'au
//   plancher (ex. max 1700 → 1700, 1600, … 300) ;
// - à défaut de max connu, les paliers par défaut ;
// - la valeur courante si elle ne correspond à aucun palier (ex. alerte étudiante).
export const buildPriceOptions = (max?: number, current?: number | null): number[] => {
  let base: number[]
  if (max && max >= PRICE_FILTER_MIN) {
    base = []
    for (let p = max; p >= PRICE_FILTER_MIN; p -= PRICE_FILTER_STEP) base.push(p)
  } else if (max) {
    base = [max]
  } else {
    base = [...PRICE_FILTER_OPTIONS]
  }
  if (current != null && !base.includes(current)) return [...base, current].sort((a, b) => b - a)
  return base
}
