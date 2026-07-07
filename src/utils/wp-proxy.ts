const WP_ORIGIN = 'https://info.monlogementetudiant.beta.gouv.fr'

// En-têtes de réponse à ne pas relayer tels quels : fetch a déjà décodé et ré-encadré
// le corps, donc content-encoding/length/transfer-encoding seraient incohérents côté client.
// On laisse aussi Next poser sa propre politique HSTS.
const STRIPPED_RESPONSE_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'strict-transport-security',
])

function relayResponseHeaders(source: Headers): Headers {
  const headers = new Headers()
  source.forEach((value, key) => {
    if (!STRIPPED_RESPONSE_HEADERS.has(key.toLowerCase())) headers.set(key, value)
  })
  return headers
}

function forwardRequestHeaders(source: Headers): Headers {
  const headers = new Headers(source)
  // fetch repositionne Host/Content-Length depuis l'URL et le corps ; on évite les incohérences.
  headers.delete('host')
  headers.delete('connection')
  headers.delete('content-length')
  return headers
}

type ProxyWpOptions = {
  /** Chemin (avec slash initial) sur l'origine WordPress, ex. '/foire-aux-questions/'. */
  path: string
  /** Fraîcheur du Data Cache Next en secondes (défaut 6h). */
  revalidate?: number
}

/**
 * Proxy cachant les pages du WordPress `info.` au niveau de l'app.
 *
 * Les GET sont mis en cache par le Data Cache de Next (clé = URL complète, query comprise) :
 * WordPress n'est retapé qu'une fois par page et par `revalidate`, quel que soit le trafic.
 * Les pages publiques ne posent pas de cookie → le cache partagé est sûr.
 * Les autres méthodes (formulaires) passent en direct, sans cache.
 */
export async function proxyWp(request: Request, { path, revalidate = 21600 }: ProxyWpOptions) {
  const { search } = new URL(request.url)
  const upstream = `${WP_ORIGIN}${path}${search}`

  if (request.method !== 'GET') {
    const passthrough = await fetch(upstream, {
      method: request.method,
      headers: forwardRequestHeaders(request.headers),
      // Corps bufferisé : ce sont de petits POST de formulaire, pas de streaming à gérer.
      body: await request.arrayBuffer(),
      cache: 'no-store',
      redirect: 'manual',
    })

    return new Response(passthrough.body, {
      status: passthrough.status,
      headers: relayResponseHeaders(passthrough.headers),
    })
  }

  const response = await fetch(upstream, { next: { revalidate } })
  const body = await response.text()
  const headers = relayResponseHeaders(response.headers)
  headers.set('cache-control', `public, s-maxage=${revalidate}, stale-while-revalidate=86400`)

  return new Response(body, { status: response.status, headers })
}
