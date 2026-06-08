'use server'

import { headers } from 'next/headers'
import { auth } from '~/services/better-auth'

export async function resendVerificationEmail(email: string) {
  const requestHeaders = await headers()
  await auth.api.sendVerificationEmail({
    // Après activation, renvoyer vers la page de connexion (réassurance) plutôt que /mon-espace
    body: { email, callbackURL: '/se-connecter?activated=1' },
    headers: requestHeaders,
  })
  return { success: true }
}
