import { z } from 'zod'

/**
 * Statut normalisé du dossier d'un locataire DossierFacile (`dossier_facile_tenant.status`),
 * alimenté par l'OAuth (profil) puis maintenu à jour par le webhook partenaire.
 *
 * Doit rester synchronisé avec `normalizeStatus` (src/server/services/dossier-facile/sync.ts).
 */
export const DF_TENANT_STATUSES = ['verified', 'denied', 'access_revoked', 'active', 'inactive', 'to_process', 'incomplete'] as const
export type DFTenantStatus = (typeof DF_TENANT_STATUSES)[number]

export const ZDFTenantStatus = z.enum(DF_TENANT_STATUSES)

/** Seul statut pour lequel la candidature est visible côté gestionnaire. */
export const DF_TENANT_STATUS_VERIFIED: DFTenantStatus = 'verified'

/**
 * Statuts terminaux : l'accès au dossier est perdu, l'étudiant doit reconnecter DossierFacile
 * avant de pouvoir candidater. Les autres statuts (dossier en cours d'instruction) autorisent
 * la candidature : elle restera masquée du board tant que le dossier n'est pas `verified`.
 */
export const DF_TENANT_STATUSES_BLOCKING_APPLICATION: readonly DFTenantStatus[] = ['access_revoked', 'inactive']

/**
 * Durée de conservation des données issues de DossierFacile Connect, en jours.
 *
 * Volontairement distincte de `CONTACT_RETENTION_DAYS` bien que les deux valent 30 : les deux
 * canaux relèvent d'obligations différentes, et un futur ajustement des demandes de contact ne doit
 * pas s'appliquer en silence à DossierFacile. La charte partenaire plafonne à 3 mois ; DossierFacile
 * vise 45 jours pour lui-même.
 */
export const DF_RETENTION_DAYS = 30
