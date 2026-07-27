import { createHmac, timingSafeEqual } from 'node:crypto'
import { env } from '~/server/env'

/**
 * Jetons signés remis au visiteur après une demande de contact anonyme.
 *
 * Deux usages distincts, séparés par `purpose` pour qu'un jeton de préremplissage — qui circule dans
 * une URL de navigateur — ne puisse jamais servir à confirmer une demande à la place de son
 * destinataire :
 * - `claim`   : prérempli le formulaire d'inscription (`/s-inscrire?claim=…`)
 * - `confirm` : vaut double opt-in, envoyé par e-mail (`/api/contacts/confirmer?token=…`)
 *
 * Le rattachement effectif d'une demande à un compte ne repose sur aucun de ces jetons : il se fait
 * uniquement sur e-mail vérifié (voir `link-guest-requests.ts`).
 */
export type TClaimTokenPurpose = 'claim' | 'confirm'

const TOKEN_TTL_MS: Record<TClaimTokenPurpose, number> = {
  claim: 7 * 24 * 60 * 60 * 1000,
  confirm: 7 * 24 * 60 * 60 * 1000,
}

const sign = (payload: string) => createHmac('sha256', env.AUTH_SECRET).update(payload).digest('base64url')

export const createClaimToken = (contactRequestId: string, purpose: TClaimTokenPurpose = 'claim'): string => {
  const payload = Buffer.from(JSON.stringify({ id: contactRequestId, purpose, exp: Date.now() + TOKEN_TTL_MS[purpose] })).toString(
    'base64url',
  )
  return `${payload}.${sign(payload)}`
}

/** Renvoie l'id de la demande si le jeton est authentique, non expiré et du bon usage, `null` sinon. */
export const verifyClaimToken = (token: string, expectedPurpose: TClaimTokenPurpose = 'claim'): string | null => {
  const [payload, signature] = token.split('.')
  if (!payload || !signature) return null

  const expected = Buffer.from(sign(payload))
  const received = Buffer.from(signature)
  if (expected.length !== received.length || !timingSafeEqual(expected, received)) return null

  try {
    const { id, purpose, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString()) as {
      id?: unknown
      purpose?: unknown
      exp?: unknown
    }
    if (typeof id !== 'string' || typeof exp !== 'number' || exp < Date.now()) return null
    if (purpose !== expectedPurpose) return null
    return id
  } catch {
    return null
  }
}
