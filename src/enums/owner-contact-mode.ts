import { z } from 'zod'

/**
 * Mode de réception des candidatures d'un gestionnaire (owner). Exclusif :
 * - `none` : non configuré (affiche la page de choix).
 * - `contacts` : coordonnées d'étudiants à recontacter (email/téléphone).
 * - `dossier_facile` : dossier complet via DossierFacile.
 *
 * Doit rester synchronisé avec `ownerContactModeEnum` (src/server/db/schema/owners.ts).
 */
export enum EOwnerContactMode {
  NONE = 'none',
  CONTACTS = 'contacts',
  DOSSIER_FACILE = 'dossier_facile',
}

export const OWNER_CONTACT_MODES = Object.values(EOwnerContactMode)

export const ZOwnerContactMode = z.enum(EOwnerContactMode)

export const OWNER_CONTACT_MODE_LABELS: Record<EOwnerContactMode, string> = {
  [EOwnerContactMode.NONE]: 'Aucun',
  [EOwnerContactMode.CONTACTS]: 'Coordonnées à recontacter',
  [EOwnerContactMode.DOSSIER_FACILE]: 'DossierFacile',
}
