'use client'

import { useEffect } from 'react'

/**
 * Redirige côté client vers l'URL de vérification Better Auth.
 *
 * La consommation du token (usage unique) n'a lieu qu'au moment où ce JavaScript
 * s'exécute. Un scanner de mail qui se contente d'un GET de la page tampon ne suit
 * jamais cette redirection → le token reste valide pour le vrai navigateur du
 * gestionnaire. On utilise une navigation top-level (et non un fetch) pour que le
 * cookie de session posé par l'endpoint verify soit bien pris en compte.
 */
export const MagicLinkRedirect = ({ url }: { url: string }) => {
  useEffect(() => {
    window.location.href = url
  }, [url])

  return null
}
