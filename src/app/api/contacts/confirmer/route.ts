import { and, eq, isNull } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { createClaimToken, verifyClaimToken } from '~/server/contacts/claim-token'
import { db } from '~/server/db'
import { contactRequests } from '~/server/db/schema'
import { env } from '~/server/env'
import { ensureFavorite } from '~/server/favorites/ensure-favorite'

/**
 * Double opt-in : le visiteur clique le lien reçu par e-mail, ce qui rend ses coordonnées visibles
 * du gestionnaire, puis atterrit sur l'inscription préremplie.
 *
 * Volontairement idempotent et sans page tampon JS (contrairement aux magic links, cf.
 * `/connexion/verification`) : confirmer n'est pas destructif et le jeton n'est pas à usage unique,
 * donc un scanner de mail d'entreprise qui pré-ouvre le lien ne casse rien.
 */
export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('token')
  const invalid = NextResponse.redirect(`${env.BASE_URL}/?contact_confirmation=invalide`)

  if (!token) return invalid

  const id = verifyClaimToken(token, 'confirm')
  if (!id) return invalid

  const contact = await db.query.contactRequests.findFirst({
    where: eq(contactRequests.id, id),
    columns: { id: true, userId: true, accommodationId: true, confirmedAt: true },
  })
  if (!contact) return invalid

  if (!contact.confirmedAt) {
    await db
      .update(contactRequests)
      .set({ confirmedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(contactRequests.id, id), isNull(contactRequests.confirmedAt)))
  }

  // La demande a pu être rattachée à un compte entre-temps (inscription puis clic tardif) : dans ce
  // cas la résidence doit rejoindre les favoris, comme pour une candidature faite en étant connecté.
  if (contact.userId) {
    await ensureFavorite(contact.userId, contact.accommodationId)
    return NextResponse.redirect(`${env.BASE_URL}/mon-espace/favoris`)
  }

  return NextResponse.redirect(`${env.BASE_URL}/s-inscrire?claim=${encodeURIComponent(createClaimToken(id, 'claim'))}`)
}
