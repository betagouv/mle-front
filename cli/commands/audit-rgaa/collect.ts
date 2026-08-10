import { createHash } from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { loadDocument } from './dom'
import { NOT_FOUND_MARKER } from './pages'
import type { TAuditPage, TAuditUrl } from './types'

/**
 * Cache du HTML collecté. Hors de docs/ et gitignoré, délibérément : les pages
 * authentifiées contiennent des données personnelles réelles de la base de dev.
 */
export const CACHE_DIR = '.audit-rgaa-cache'

const DEFAULT_ACCEPT_LANGUAGE = 'fr-FR,fr;q=0.9'

/** Préfixe Better Auth du projet (`cookiePrefix` dans src/services/better-auth.ts). */
export const SESSION_COOKIE_NAME = 'monlogementetudiant.session_token'

/**
 * Le cookie se copie depuis les devtools tantôt en paire `nom=valeur`, tantôt en valeur seule.
 * Envoyer une valeur seule produit un en-tête Cookie sans nom, que le serveur ignore : la session
 * est perdue et /mon-espace répond une page introuvable. On complète donc le nom si besoin.
 */
export function normalizeCookie(cookie: string | undefined): string | undefined {
  const value = cookie?.trim()
  if (!value) return undefined
  return /^[\w!#$%&'*+.^`|~-]+=/.test(value) ? value : `${SESSION_COOKIE_NAME}=${value}`
}

export type TCollectedPage = {
  scope: string
  url: string
  acceptLanguage: string
  httpStatus: number
  bytes: number
  html: string
}

export type TCollectOptions = {
  baseUrl: string
  cookie?: string
  fromCache?: boolean
  verbose?: boolean
}

function cacheKey(url: string, acceptLanguage: string): string {
  return createHash('sha1').update(`${url}|${acceptLanguage}`).digest('hex')
}

/** Vrai si la page rendue est celle de not-found.tsx (et non le simple libellé embarqué dans le payload RSC). */
function isNotFoundPage(html: string): boolean {
  const { $ } = loadDocument(html)
  return $('h1')
    .toArray()
    .some((element) => $(element).text().trim() === NOT_FOUND_MARKER)
}

async function fetchPage(url: string, acceptLanguage: string, cookie?: string): Promise<{ html: string; status: number }> {
  const headers: Record<string, string> = {
    'Accept-Language': acceptLanguage,
    'User-Agent': 'mle-audit-rgaa/1.0',
  }
  if (cookie) headers.Cookie = cookie

  // Sans ce filet, un serveur de dev éteint remonte une stack undici illisible.
  let response: Response
  try {
    response = await fetch(url, { headers, redirect: 'follow' })
  } catch (error) {
    const cause = error instanceof Error ? error.message : String(error)
    throw new Error(`Serveur injoignable : ${url} (${cause}) — démarrez « pnpm dev » ou ajustez --base-url`)
  }

  return { html: await response.text(), status: response.status }
}

/**
 * Collecte une URL avec ses garde-fous. Un audit silencieusement vide est pire
 * qu'un audit qui échoue : chaque contrôle ci-dessous est bloquant.
 */
async function collectUrl(page: TAuditPage, target: TAuditUrl, options: TCollectOptions): Promise<TCollectedPage> {
  const acceptLanguage = target.acceptLanguage ?? DEFAULT_ACCEPT_LANGUAGE
  const url = `${options.baseUrl}${target.path}`
  const cachePath = path.join(CACHE_DIR, `${cacheKey(url, acceptLanguage)}.html`)

  let html: string
  let status = 200

  if (options.fromCache && fs.existsSync(cachePath)) {
    html = fs.readFileSync(cachePath, 'utf-8')
  } else {
    const result = await fetchPage(url, acceptLanguage, page.auth ? options.cookie : undefined)
    html = result.html
    status = result.status
    fs.mkdirSync(CACHE_DIR, { recursive: true })
    fs.writeFileSync(cachePath, html, 'utf-8')
  }

  if (status !== 200) {
    const hint = page.auth ? ` (page authentifiée : vérifiez la validité du cookie « ${SESSION_COOKIE_NAME} »)` : ''
    throw new Error(`Collecte impossible : ${url} → HTTP ${status}${hint}`)
  }

  // `notFound()` répond 200 avec le corps de not-found.tsx : sans ce contrôle,
  // une session expirée ferait auditer la page d'erreur en croyant auditer /mon-espace.
  // Le test porte sur le <h1> rendu, pas sur le HTML brut : le libellé traduit figure
  // aussi dans le payload RSC de toutes les pages.
  if (isNotFoundPage(html)) {
    const reason = page.auth
      ? 'session invalide ou expirée — fournissez un cookie valide via --cookie ou AUDIT_SESSION_COOKIE'
      : 'la route ne correspond à aucune page'
    throw new Error(`Collecte impossible : ${url} renvoie la page « ${NOT_FOUND_MARKER} » (${reason})`)
  }

  const missing = target.assertContains.filter((needle) => !html.includes(needle))
  if (missing.length > 0) {
    throw new Error(`Collecte incomplète : ${url} ne contient pas ${missing.map((m) => `« ${m} »`).join(', ')}`)
  }

  if (options.verbose) {
    console.log(`    ${page.sheetName} [${target.scope}] ← ${target.path} (${Math.round(html.length / 1024)} Ko)`)
  }

  return { scope: target.scope, url, acceptLanguage, httpStatus: status, bytes: html.length, html }
}

export async function collectPage(page: TAuditPage, options: TCollectOptions): Promise<TCollectedPage[]> {
  const cookie = normalizeCookie(options.cookie)

  if (page.auth && !cookie && !options.fromCache) {
    throw new Error(
      `La feuille « ${page.sheetName} » est derrière authentification : fournissez --cookie ou la variable AUDIT_SESSION_COOKIE ` +
        `(valeur seule ou paire « ${SESSION_COOKIE_NAME}=… »)`,
    )
  }

  const collected: TCollectedPage[] = []
  for (const target of page.urls) {
    collected.push(await collectUrl(page, target, { ...options, cookie }))
  }
  return collected
}
