import { z } from 'zod'

/**
 * Origine d'un contact affiché dans l'espace gestionnaire : une candidature
 * DossierFacile (`dossier_facile_application`) ou une demande de contact
 * laissée par un étudiant (`contact_request`).
 */
export enum EContactSource {
  DOSSIER_FACILE = 'dossier_facile',
  CONTACT = 'contact',
}

export const ZContactSource = z.enum(EContactSource)
