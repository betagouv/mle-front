import { z } from 'zod'

/**
 * Mode de réception des candidatures d'un gestionnaire (owner). Exclusif :
 * - `none` : non configuré (affiche la page de choix).
 * - `contacts` : coordonnées d'étudiants à recontacter (email/téléphone).
 * - `dossier_facile` : dossier complet via DossierFacile.
 *
 * Doit rester synchronisé avec `ownerContactModeEnum` (src/server/db/schema/owners.ts).
 */
export const OWNER_CONTACT_MODES = ['none', 'contacts', 'dossier_facile'] as const
export type OwnerContactMode = (typeof OWNER_CONTACT_MODES)[number]

export const ZOwnerContactMode = z.enum(OWNER_CONTACT_MODES)

export const OWNER_CONTACT_MODE_LABELS: Record<OwnerContactMode, string> = {
  none: 'Aucun',
  contacts: 'Coordonnées à recontacter',
  dossier_facile: 'DossierFacile',
}
