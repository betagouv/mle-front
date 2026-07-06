import 'server-only'
import { type TEtablissementSuperieur, type TUaiWs, ZGeoApiCommunes, ZUaisWs, ZUaiWs } from '~/schemas/ramsese/etablissement-superieur'
import { env } from '~/server/env'

/**
 * Récupération des établissements d'enseignement supérieur via RAMSESE, à partir
 * d'un code postal.
 *
 * Flux :
 *  1. code postal → code(s) commune INSEE (geo.api.gouv.fr — un CP couvre parfois
 *     plusieurs communes) ;
 *  2. `POST /v3/listeUai/filtres` sur ces communes → liste de numéros UAI ;
 *  3. `GET /v3/uai/{uai}` (avec géoloc + administration) pour chaque UAI → lieu.
 *
 * Le supérieur correspond à la sous-catégorie 5 de la nomenclature « nature UAI »
 * (codes 5xx). L'endpoint filtres n'exposant pas de flag « supérieur », on filtre
 * les natures sur le préfixe « 5 » à l'étape 3 (source de vérité complète, pas de
 * liste de codes à maintenir). Un jeu de natures explicite peut être fourni pour
 * pré-filtrer côté API et réduire le nombre d'appels détail.
 */

const SUPERIEUR_NATURE_PREFIX = '5'
const UAI_DETAIL_REVALIDATE_S = 86_400 // référentiel stable → cache Next.js 24 h
const DETAIL_CONCURRENCY = 8

const ramseseHeaders = {
  'Content-Type': 'application/json',
  codeApplication: env.RAMSESE_CODE_APPLICATION,
}

// L'URL de base n'inclut pas /v3 ; on ajoute le préfixe des paths du swagger ici,
// et la clé passerelle Omogen en query param `api-key` (si définie).
const ramseseUrl = (path: string) => {
  const url = `${env.RAMSESE_API_URL}/v3${path}`
  if (!env.RAMSESE_API_KEY) return url
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}api-key=${encodeURIComponent(env.RAMSESE_API_KEY)}`
}

type TValeurHist = { VALEUR?: string; DATE_FIN?: string }
type TCodeHist = { CODE?: string; DATE_FIN?: string }

/** Valeur active (sans DATE_FIN) la plus pertinente d'une liste historisée. */
function pickCurrentValeur(values?: TValeurHist[]): string | null {
  if (!values?.length) return null
  const active = values.find((v) => !v.DATE_FIN && v.VALEUR)
  return (active ?? values.findLast((v) => v.VALEUR))?.VALEUR ?? null
}

/** Codes actifs (sans DATE_FIN) d'une liste de codes historisés. */
function activeCodes(codes?: TCodeHist[]): string[] {
  if (!codes?.length) return []
  return codes.filter((c) => !c.DATE_FIN && c.CODE).map((c) => c.CODE as string)
}

/** Étape 1 — code postal → codes commune INSEE (arrondissements municipaux inclus). */
async function fetchInseeCodesByPostalCode(codePostal: string): Promise<string[]> {
  const cp = encodeURIComponent(codePostal)
  // Paris / Lyon / Marseille : RAMSESE code les UAI au niveau arrondissement
  // (ex. 75113 pour Paris 13e), alors que geo.api renvoie la commune chef-lieu
  // (75056) qui ne matche aucun UAI. On interroge donc aussi les arrondissements
  // municipaux et on fusionne les codes.
  const urls = [
    `https://geo.api.gouv.fr/communes?codePostal=${cp}&fields=code,nom`,
    `https://geo.api.gouv.fr/communes?codePostal=${cp}&type=arrondissement-municipal&fields=code,nom`,
  ]
  try {
    const lists = await Promise.all(
      urls.map(async (url) => {
        const res = await fetch(url, { next: { revalidate: UAI_DETAIL_REVALIDATE_S } })
        if (!res.ok) return []
        const parsed = ZGeoApiCommunes.safeParse(await res.json())
        return parsed.success ? parsed.data.map((c) => c.code) : []
      }),
    )
    return [...new Set(lists.flat())]
  } catch {
    return []
  }
}

/** Étape 2 — communes INSEE → numéros UAI. */
async function fetchUaisByCommunes(communes: string[], natures?: string[], secteurs?: string[]): Promise<string[]> {
  try {
    const res = await fetch(ramseseUrl('/listeUai/filtres'), {
      method: 'POST',
      headers: ramseseHeaders,
      body: JSON.stringify({
        communes,
        codeApplication: env.RAMSESE_CODE_APPLICATION,
        ...(natures?.length ? { natures } : {}),
        ...(secteurs?.length ? { secteurs } : {}),
      }),
      next: { revalidate: UAI_DETAIL_REVALIDATE_S },
    })
    if (!res.ok) throw new Error(`RAMSESE listeUai/filtres failed: ${res.status}`)
    const parsed = ZUaisWs.safeParse(await res.json())
    if (!parsed.success) return []
    return parsed.data.UAIS
  } catch {
    return []
  }
}

/** Étape 3 — détail d'un UAI (identification + localisation + géoloc). */
async function fetchUaiDetail(numeroUai: string): Promise<TUaiWs | null> {
  const params = new URLSearchParams({
    INCLURE_GEOLOCALISATION: 'true',
    ADMINISTRATION: 'true',
  })
  try {
    const res = await fetch(ramseseUrl(`/uai/${encodeURIComponent(numeroUai)}?${params}`), {
      headers: ramseseHeaders,
      next: { revalidate: UAI_DETAIL_REVALIDATE_S },
    })
    if (!res.ok) return null
    const parsed = ZUaiWs.safeParse(await res.json())
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Fan-out borné pour éviter de saturer la passerelle sur les grosses villes. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index])
    }
  })
  await Promise.all(workers)
  return results
}

function toEtablissement(uai: TUaiWs): TEtablissementSuperieur | null {
  const numeroUai = uai.IDENTIFICATION?.NUMERO_UAI
  if (!numeroUai) return null

  const geo = uai.GEOLOCALISATION
  const coordonnees =
    geo?.COORDONNEES_X && geo.COORDONNEES_Y
      ? {
          x: geo.COORDONNEES_X,
          y: geo.COORDONNEES_Y,
          systemeReference: geo.SYSTEME_REFERENCE ?? null,
        }
      : null

  return {
    numeroUai,
    denomination:
      pickCurrentValeur(uai.IDENTIFICATION?.APPELLATIONS_OFFICIELLES) ?? pickCurrentValeur(uai.IDENTIFICATION?.DENOMINATIONS_PRINCIPALES),
    sigle: pickCurrentValeur(uai.IDENTIFICATION?.SIGLES),
    natureCodes: activeCodes(uai.IDENTIFICATION?.NATURES),
    secteur: activeCodes(uai.IDENTIFICATION?.SECTEURS)[0] ?? null,
    adresse: pickCurrentValeur(uai.LOCALISATION?.ADRESSES),
    codePostal: uai.LOCALISATION?.CODE_POSTAL ?? null,
    commune: uai.LOCALISATION?.LOCALITE_ACHEMINEMENT ?? null,
    codeInseeCommune: uai.ADMINISTRATION?.CODE_INSEE_COMMUNE ?? null,
    telephone: uai.LOCALISATION?.TELEPHONE ?? null,
    email: uai.LOCALISATION?.MEL ?? null,
    coordonnees,
  }
}

export type TGetEtablissementsSuperieurOptions = {
  /** Codes « nature » explicites pour pré-filtrer côté API (perf). Défaut : sous-cat. 5. */
  natures?: string[]
  /** Secteurs à conserver (ex. `['PU', 'PR']`). Défaut : tous. */
  secteurs?: string[]
}

/**
 * Retourne les établissements d'enseignement supérieur situés dans la/les commune(s)
 * couverte(s) par un code postal. Renvoie `[]` si le CP est inconnu ou l'API muette.
 */
export async function getEtablissementsSuperieurByCodePostal(
  codePostal: string,
  options: TGetEtablissementsSuperieurOptions = {},
): Promise<TEtablissementSuperieur[]> {
  const communes = await fetchInseeCodesByPostalCode(codePostal)
  if (communes.length === 0) return []

  const numerosUai = await fetchUaisByCommunes(communes, options.natures, options.secteurs)
  if (numerosUai.length === 0) return []

  const details = await mapWithConcurrency(numerosUai, DETAIL_CONCURRENCY, fetchUaiDetail)

  const naturesFilter = options.natures?.length ? new Set(options.natures) : null
  const isSuperieur = (codes: string[]) =>
    naturesFilter ? codes.some((c) => naturesFilter.has(c)) : codes.some((c) => c.startsWith(SUPERIEUR_NATURE_PREFIX))

  return details
    .map((uai) => (uai ? toEtablissement(uai) : null))
    .filter((e): e is TEtablissementSuperieur => e !== null && isSuperieur(e.natureCodes))
}

// Exports internes pour les tests unitaires.
export const _internal = {
  fetchInseeCodesByPostalCode,
  fetchUaisByCommunes,
  fetchUaiDetail,
  toEtablissement,
  mapWithConcurrency,
}
