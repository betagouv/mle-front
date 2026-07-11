import { handle } from 'hono/vercel'
import { apiV1App } from '~/server/api/v1/app'

// PostGIS/Drizzle + Better Auth → runtime Node.js (pas edge). Pas de cache : le rate-limit par clé et
// l'usage doivent être évalués à chaque requête.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const handler = handle(apiV1App)

export { handler as GET, handler as OPTIONS }
