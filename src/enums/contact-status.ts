import type { BadgeProps } from '@codegouvfr/react-dsfr/Badge'
import { z } from 'zod'

/**
 * Vocabulaire de statut partagé entre les candidatures DossierFacile
 * (`dossier_facile_application.status`) et les demandes de contact
 * (`contact_request.status`). Stocké en `text` libre, validé par `ZContactStatus`.
 */
export const CONTACT_STATUSES = ['a_moderer', 'a_contacter', 'contacte', 'non_retenu'] as const
export type ContactStatus = (typeof CONTACT_STATUSES)[number]

export const ZContactStatus = z.enum(CONTACT_STATUSES)

interface StatusConfig {
  label: string
  /** Sévérité DSFR du Badge, ou `null` pour un rendu gris neutre (non retenu). */
  severity: BadgeProps['severity'] | null
  /** Couleur de la bordure basse de la carte. */
  barColor: string
}

export const CONTACT_STATUS_CONFIG: Record<ContactStatus, StatusConfig> = {
  a_moderer: { label: 'À modérer', severity: 'new', barColor: '#c3992a' },
  non_retenu: { label: 'Non retenu', severity: null, barColor: '#929292' },
  a_contacter: { label: 'À contacter', severity: 'error', barColor: '#e1000f' },
  contacte: { label: 'Contacté', severity: 'success', barColor: '#18753c' },
}

/** Colonnes du board selon le mode (ordre d'affichage = ordre des écrans). */
export const DF_COLUMNS: readonly ContactStatus[] = ['a_moderer', 'non_retenu', 'a_contacter', 'contacte']
export const CONTACTS_COLUMNS: readonly ContactStatus[] = ['a_contacter', 'non_retenu', 'contacte']

/** Statut « à rappeler » compté dans le badge des cartes résidence. */
export const A_RAPPELER_STATUS: ContactStatus = 'a_contacter'

export const columnsForMode = (mode: 'contacts' | 'dossier_facile'): readonly ContactStatus[] =>
  mode === 'dossier_facile' ? DF_COLUMNS : CONTACTS_COLUMNS
