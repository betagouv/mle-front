import { eq } from 'drizzle-orm'
import { jwtVerify } from 'jose'
import { NextResponse } from 'next/server'
import { findVisibleApplicationForTenant } from '~/server/candidatures/visibility'
import { db } from '~/server/db'
import { accommodations, dossierFacileDocuments, dossierFacileTenants, user } from '~/server/db/schema'
import { env } from '~/server/env'
import { getJwtSecret } from '~/server/utils/jwt-secret'
import { getServerSession } from '~/services/better-auth'

const ERROR_PAGE = '/dossier-facile/error'

function errorRedirect(errorType: string) {
  const baseUrl = env.BASE_URL
  return NextResponse.redirect(`${baseUrl}${ERROR_PAGE}?error_type=${errorType}`)
}

/**
 * Redirige vers une pièce du dossier DossierFacile d'un candidat.
 *
 * Le jeton signé (60 s) est une commodité, **pas** une autorisation : il a été émis à un instant où
 * la candidature était visible, ce qui ne dit rien de l'instant où il est consommé. Session,
 * propriété de la résidence et fenêtre de rétention sont donc revérifiées ici — sans quoi le jeton
 * serait un porteur pur, exploitable par quiconque l'intercepte, sans même être connecté.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return errorRedirect('doc_invalid_link')
  }

  const session = await getServerSession()
  if (!session) {
    return errorRedirect('doc_forbidden')
  }

  try {
    const { payload } = await jwtVerify(token, getJwtSecret())
    const { urlType, targetId, sub } = payload as { urlType: string; targetId: string; sub?: string }

    // Le jeton est nominatif : il ne vaut que pour le compte auquel il a été délivré.
    if (sub !== session.user.id) {
      return errorRedirect('doc_forbidden')
    }

    const document =
      urlType === 'document'
        ? await db.query.dossierFacileDocuments.findFirst({
            where: eq(dossierFacileDocuments.id, targetId),
            columns: { url: true, tenantId: true },
          })
        : null

    const tenantId = urlType === 'document' ? document?.tenantId : targetId
    if (!tenantId) return errorRedirect('doc_not_found')

    // Hors rétention, ou dossier plus validé : l'accès tombe, jeton valide en main ou non.
    const application = await findVisibleApplicationForTenant(tenantId)
    if (!application) return errorRedirect('doc_forbidden')

    if (!(await callerOwnsAccommodation(session.user.id, application.accommodationSlug))) {
      return errorRedirect('doc_forbidden')
    }

    let url: string | null = null

    if (urlType === 'tenantPdf' || urlType === 'tenantUrl') {
      const tenant = await db.query.dossierFacileTenants.findFirst({
        where: eq(dossierFacileTenants.id, tenantId),
        columns: { url: true, pdfUrl: true },
      })
      url = (urlType === 'tenantPdf' ? tenant?.pdfUrl : tenant?.url) ?? null
    } else if (urlType === 'document') {
      url = document?.url ?? null
    }

    if (!url) {
      return errorRedirect('doc_not_found')
    }

    return NextResponse.redirect(url)
  } catch {
    return errorRedirect('doc_expired')
  }
}

/** Le compte consulte-t-il une résidence de son propre parc ? Un admin plateforme passe toujours. */
async function callerOwnsAccommodation(userId: string, accommodationSlug: string): Promise<boolean> {
  const usr = await db.query.user.findFirst({ where: eq(user.id, userId), with: { owner: true } })
  if (usr?.role === 'admin') return true
  if (!usr?.owner) return false

  const accommodation = await db.query.accommodations.findFirst({
    where: eq(accommodations.slug, accommodationSlug),
    columns: { ownerId: true },
  })
  return accommodation?.ownerId === usr.owner.id
}
