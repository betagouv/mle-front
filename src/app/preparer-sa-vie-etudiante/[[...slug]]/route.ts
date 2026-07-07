import { proxyWp } from '~/utils/wp-proxy'

type RouteContext = { params: Promise<{ slug?: string[] }> }

// Proxy caché vers l'espace « préparer sa vie étudiante » (remplace les rewrites associés).
// Le chemin nu renvoyait vers la racine WordPress → on conserve ce comportement.
async function handler(request: Request, { params }: RouteContext) {
  const segments = (await params).slug ?? []
  const path = segments.length === 0 ? '' : `/preparer-sa-vie-etudiante/${segments.join('/')}/`

  return proxyWp(request, { path })
}

export { handler as GET, handler as POST }
