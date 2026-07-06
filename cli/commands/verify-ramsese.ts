import { and, eq, sql } from 'drizzle-orm'
import { NATURES_ETABLISSEMENTS } from '~/schemas/ramsese/natures'
import { env } from '~/server/env'
import { haversineMeters, parseRamseseCoordonnees } from '~/utils/geo'

/**
 * Commande de vérification RAMSESE — à lancer dans un one-off Scalingo (IP whitelistée).
 *
 * Rejoue le pipeline exact de la fiche logement (CP -> communes INSEE -> filtres UAI ->
 * détails géolocalisés -> distance) en réutilisant le vrai code de parsing/distance
 * (`~/utils/geo`) et la vraie liste blanche des natures. Réplique seulement les 3 appels
 * fetch en inline car le service `~/server/services/ramsese` importe `server-only`
 * (non résoluble hors bundler Next).
 *
 *   mle verify-ramsese --cp 94000
 *   mle verify-ramsese --slug residence-xxx          # CP + coords depuis la BDD
 *   mle verify-ramsese --cp 94000 --lat 48.79 --lng 2.45 --dump
 */

const BASE = env.RAMSESE_API_URL
const CODEAPP = env.RAMSESE_CODE_APPLICATION
const HEADERS = { 'Content-Type': 'application/json', codeApplication: CODEAPP }
const FETCH_TIMEOUT_MS = 15_000

const distanceFmt = new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

interface VerifyRamseseOptions {
  cp?: string
  slug?: string
  lat?: string
  lng?: string
  limit?: number
  natures?: boolean // commander: --no-natures => natures === false
  dump?: boolean
}

type LatLng = { lat: number; lng: number }

async function mapPool<T, R>(items: T[], limit: number, fn: (x: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++
      results[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return results
}

// biome-ignore lint/suspicious/noExplicitAny: payloads RAMSESE bruts, non typés ici
type Json = any

/** Récupère CP + coords (WGS84) d'une résidence depuis la BDD (chemin fidèle à la prod). */
async function resolveFromSlug(slug: string): Promise<{ codePostal: string; residence: LatLng } | null> {
  const { db, closeDb } = await import('~/server/db')
  const { accommodations } = await import('~/server/db/schema/accommodations')
  const { accommodationAddresses } = await import('~/server/db/schema/accommodation-addresses')
  try {
    const [row] = await db
      .select({
        postalCode: accommodationAddresses.postalCode,
        lat: sql<number>`ST_Y(${accommodationAddresses.geom}::geometry)`,
        lng: sql<number>`ST_X(${accommodationAddresses.geom}::geometry)`,
      })
      .from(accommodations)
      .innerJoin(
        accommodationAddresses,
        and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
      )
      .where(eq(accommodations.slug, slug))
      .limit(1)
    if (!row) return null
    return { codePostal: row.postalCode, residence: { lat: row.lat, lng: row.lng } }
  } finally {
    await closeDb()
  }
}

/** Étape 1 — CP -> communes INSEE (+ centre pour approximer la résidence si pas de coords). */
async function fetchCommunes(cp: string): Promise<{ code: string; nom: string; centre?: LatLng }[]> {
  const url = `https://geo.api.gouv.fr/communes?codePostal=${encodeURIComponent(cp)}&fields=code,nom,centre`
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) })
  if (!res.ok) return []
  const data = (await res.json()) as Json[]
  return data.map((c) => ({
    code: c.code,
    nom: c.nom,
    centre: c.centre ? { lng: c.centre.coordinates[0], lat: c.centre.coordinates[1] } : undefined,
  }))
}

/** Étape 2 — communes INSEE -> numéros UAI. */
async function fetchUais(communes: string[], natures: string[] | null): Promise<{ status: number; uais: string[] }> {
  try {
    const res = await fetch(`${BASE}/v3/listeUai/filtres`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ communes, codeApplication: CODEAPP, ...(natures ? { natures } : {}) }),
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    let uais: string[] = []
    try {
      const body = (await res.json()) as Json
      uais = body?.UAIS ?? []
    } catch {
      // corps non JSON (erreur passerelle) : on garde juste le status
    }
    return { status: res.status, uais }
  } catch (err) {
    console.error(`   ✗ échec réseau filtres : ${err instanceof Error ? err.message : String(err)}`)
    return { status: 0, uais: [] }
  }
}

/** Étape 3 — détail d'un UAI (identification + localisation + géoloc). */
async function fetchUaiDetail(uai: string): Promise<{ status: number; data: Json | null }> {
  try {
    const res = await fetch(`${BASE}/v3/uai/${encodeURIComponent(uai)}?INCLURE_GEOLOCALISATION=true&ADMINISTRATION=true`, {
      headers: HEADERS,
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })
    const data = res.ok ? ((await res.json().catch(() => null)) as Json) : null
    return { status: res.status, data }
  } catch {
    return { status: 0, data: null }
  }
}

function pickValeur(arr?: Json[]): string | null {
  if (!arr?.length) return null
  return (arr.find((v) => !v.DATE_FIN && v.VALEUR) ?? arr.findLast?.((v: Json) => v.VALEUR))?.VALEUR ?? null
}

export async function verifyRamsese(options: VerifyRamseseOptions) {
  console.log('🔎 Vérification RAMSESE')
  console.log(`   BASE=${BASE}  codeApplication=${CODEAPP}`)

  // 1) Résolution CP + point résidence
  let codePostal = options.cp ?? '94000'
  let residence: LatLng | null = options.lat != null && options.lng != null ? { lat: Number(options.lat), lng: Number(options.lng) } : null

  if (options.slug) {
    const resolved = await resolveFromSlug(options.slug)
    if (!resolved) {
      console.error(`✗ Résidence introuvable pour le slug "${options.slug}"`)
      process.exit(1)
    }
    codePostal = resolved.codePostal
    residence = resolved.residence
    console.log(`   Résidence "${options.slug}" : CP=${codePostal}  résidence=${residence.lat},${residence.lng}`)
  }

  const communes = await fetchCommunes(codePostal)
  if (communes.length === 0) {
    console.error(`✗ Aucune commune pour le CP ${codePostal} (geo.api.gouv.fr)`)
    process.exit(1)
  }
  console.log(`\n1) CP ${codePostal} -> communes INSEE : ${communes.map((c) => `${c.code} ${c.nom}`).join(', ')}`)

  if (!residence) {
    residence = communes[0].centre ?? { lat: 0, lng: 0 }
    console.log(`   (pas de --lat/--lng : distance calculée depuis le centre de ${communes[0].nom})`)
  }

  // 2) filtres -> UAIS
  const useNatures = options.natures !== false
  const inseeCodes = communes.map((c) => c.code)
  const naturesArg = useNatures ? [...NATURES_ETABLISSEMENTS] : null
  let { status, uais } = await fetchUais(inseeCodes, naturesArg)
  console.log(
    `\n2) POST /v3/listeUai/filtres -> HTTP ${status} | UAIS=${uais.length}${useNatures ? ' (liste blanche)' : ' (sans filtre natures)'}`,
  )
  if (status !== 200) {
    console.log('   ⚠️  Status ≠ 200 : 401/403=IP non whitelistée (ou auth) · 404=chemin /v3 à ajuster · 0/5xx=réseau/passerelle')
  }
  if (uais.length === 0 && useNatures) {
    const fallback = await fetchUais(inseeCodes, null)
    console.log(`   (diagnostic sans natures) -> HTTP ${fallback.status} | UAIS=${fallback.uais.length}`)
    if (fallback.uais.length) {
      console.log('   → connectivité OK mais la liste blanche ne matche rien sur cette commune.')
      uais = fallback.uais
    }
  }
  if (uais.length === 0) {
    console.log('\nAucun UAI à détailler. Fin.')
    process.exit(0)
  }

  // 3) détails + parsing + distance
  const limit = options.limit ?? uais.length
  const subset = uais.slice(0, limit)
  console.log(`\n3) Détails de ${subset.length}/${uais.length} UAI (INCLURE_GEOLOCALISATION + ADMINISTRATION) :`)

  const rows = await mapPool(subset, 8, async (uai) => {
    const { status: st, data } = await fetchUaiDetail(uai)
    if (!data) return { uai, status: st, error: true } as const
    const id = data.IDENTIFICATION ?? {}
    const geo = data.GEOLOCALISATION ?? {}
    const nom = pickValeur(id.APPELLATIONS_OFFICIELLES) ?? pickValeur(id.DENOMINATIONS_PRINCIPALES) ?? '?'
    const natures: string[] = (id.NATURES ?? []).filter((n: Json) => !n.DATE_FIN).map((n: Json) => n.CODE)
    const rawCoords =
      geo.COORDONNEES_X && geo.COORDONNEES_Y
        ? { x: String(geo.COORDONNEES_X), y: String(geo.COORDONNEES_Y), systemeReference: geo.SYSTEME_REFERENCE ?? null }
        : null
    const point = rawCoords ? parseRamseseCoordonnees(rawCoords) : null
    const distanceMeters = point ? haversineMeters(residence, point) : null
    return { uai, status: st, nom, natures, rawCoords, point, distanceMeters }
  })

  const systems = new Set<string>()
  for (const r of rows) {
    if ('error' in r) {
      console.log(`   ${r.uai} | HTTP ${r.status} | (pas de détail)`)
      continue
    }
    if (r.rawCoords?.systemeReference) systems.add(r.rawCoords.systemeReference)
    const coordsStr = r.rawCoords ? `X=${r.rawCoords.x} Y=${r.rawCoords.y} ref=${r.rawCoords.systemeReference}` : 'PAS DE GEOLOC'
    const parsed = r.point ? `-> ${r.point.lat.toFixed(5)},${r.point.lng.toFixed(5)}` : ''
    const dist = r.distanceMeters != null ? `| ${distanceFmt.format(r.distanceMeters / 1000)} km` : ''
    console.log(`   ${r.uai} | ${r.nom} | nat=[${r.natures.join(',')}] | ${coordsStr} ${parsed} ${dist}`)
  }

  console.log(`\n   Systèmes de référence rencontrés : ${systems.size ? [...systems].join(', ') : 'aucun'}`)

  // Top 5 = ce que le bloc afficherait
  const ranked = rows
    .filter((r): r is Extract<typeof r, { distanceMeters: number | null }> => !('error' in r) && r.distanceMeters != null)
    .sort((a, b) => (a.distanceMeters as number) - (b.distanceMeters as number))
    .slice(0, 5)
  console.log('\n🏁 Top 5 (rendu attendu du bloc fiche logement) :')
  for (const r of ranked) {
    console.log(`   ${r.nom} — ${distanceFmt.format((r.distanceMeters as number) / 1000)} km`)
  }

  // Payload complet de référence
  if (options.dump) {
    const { data } = await fetchUaiDetail(uais[0])
    console.log(`\n===== PAYLOAD COMPLET ${uais[0]} =====`)
    console.log(JSON.stringify(data, null, 2))
  } else {
    console.log('\n(relance avec --dump pour le payload JSON complet du 1er UAI)')
  }

  process.exit(0)
}
