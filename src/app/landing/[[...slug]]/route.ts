import { proxyWp } from '~/utils/wp-proxy'

type RouteContext = { params: Promise<{ slug?: string[] }> }

// Proxy caché vers les pages « partenariat » exposées sous /landing (remplace les rewrites associés).
async function handler(request: Request, { params }: RouteContext) {
  const segments = (await params).slug ?? []
  const path = segments.length === 0 ? '/partenariat/' : `/partenariat/${segments.join('/')}/`

  return proxyWp(request, { path })
}

export { handler as GET, handler as POST }
