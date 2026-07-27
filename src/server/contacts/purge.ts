import { and, count, inArray, isNull, lt, sql } from 'drizzle-orm'
import { UNCONFIRMED_CONTACT_RETENTION_DAYS } from '~/enums/contact-status'
import { contactRetentionCutoff } from '~/server/candidatures/visibility'
import { db } from '~/server/db'
import { contactRequests, dossierFacileApplications, dossierFacileDocuments, dossierFacileTenants } from '~/server/db/schema'

const DAY_MS = 24 * 60 * 60 * 1000

export interface PurgeContactRequestsResult {
  /** Demandes visiteur jamais confirmées, supprimées. */
  deleted: number
  /** Demandes de contact dont les coordonnées ont été vidées. */
  anonymized: number
  /** Locataires DossierFacile dont les liens de dossier et de documents ont été coupés. */
  dossiersPurged: number
}

/**
 * Locataires DossierFacile dont la candidature la plus récente est sortie de la fenêtre de
 * rétention : plus aucun gestionnaire n'a de motif d'accéder à leur dossier.
 *
 * Le `group by` garantit au passage qu'on ne retient que des locataires ayant effectivement
 * candidaté — celui qui a seulement lié son compte sans jamais candidater n'a exposé son dossier à
 * personne, et le purger relancerait un effacement inutile à chaque passage du cron.
 */
const findTenantsOutOfRetention = async (): Promise<string[]> => {
  const rows = await db
    .select({ tenantId: dossierFacileApplications.tenantId })
    .from(dossierFacileApplications)
    .groupBy(dossierFacileApplications.tenantId)
    // `toISOString` explicite : en SQL brut, Drizzle n'a pas le mapper de colonne pour sérialiser un Date.
    .having(sql`max(${dossierFacileApplications.createdAt}) < ${contactRetentionCutoff().toISOString()}::timestamptz`)

  return rows.map((r) => r.tenantId)
}

/**
 * Purge RGPD des candidatures, tous canaux confondus.
 *
 * **Demandes de contact** — deux passes :
 * 1. suppression des demandes visiteur jamais confirmées par double opt-in au-delà de 7 jours :
 *    elles n'ont jamais été transmises à personne, il n'y a rien à en conserver ;
 * 2. anonymisation des demandes de plus de 30 jours — la ligne survit, seules les coordonnées
 *    partent. Ce qui reste (résidence, date, statut, type de logement, et `user_id` quand la demande
 *    est liée à un compte) suffit à l'historique et aux compteurs.
 *
 * **Candidatures DossierFacile** — la ligne `dossier_facile_application` ne porte aucune donnée
 * personnelle : tout est sur le locataire et son compte, qui doivent survivre. Ce qu'on coupe, c'est
 * l'accès du gestionnaire au dossier : les documents mis en cache et les liens vers DossierFacile.
 * Les candidatures elles-mêmes sont conservées pour l'historique, et déjà masquées côté lecture par
 * `visibleDossierFacileApplication`. Une resynchronisation repeuple le cache si l'étudiant
 * recandidate.
 *
 * Idempotent : `anonymized_at` et les colonnes déjà à `null` empêchent de repasser sur les lignes
 * déjà traitées.
 */
export const purgeContactRequests = async ({ dryRun = false } = {}): Promise<PurgeContactRequestsResult> => {
  const unconfirmedCutoff = new Date(Date.now() - UNCONFIRMED_CONTACT_RETENTION_DAYS * DAY_MS)

  const staleUnconfirmed = and(
    isNull(contactRequests.userId),
    isNull(contactRequests.confirmedAt),
    lt(contactRequests.createdAt, unconfirmedCutoff),
  )
  const outOfRetention = () => and(lt(contactRequests.createdAt, contactRetentionCutoff()), isNull(contactRequests.anonymizedAt))

  const staleTenantIds = await findTenantsOutOfRetention()

  if (dryRun) {
    const [[unconfirmed], [expired]] = await Promise.all([
      db.select({ n: count() }).from(contactRequests).where(staleUnconfirmed),
      db.select({ n: count() }).from(contactRequests).where(outOfRetention()),
    ])
    return { deleted: unconfirmed?.n ?? 0, anonymized: expired?.n ?? 0, dossiersPurged: staleTenantIds.length }
  }

  const deleted = await db.delete(contactRequests).where(staleUnconfirmed).returning({ id: contactRequests.id })

  const anonymized = await db
    .update(contactRequests)
    .set({
      firstname: null,
      lastname: null,
      email: null,
      phone: null,
      ipHash: null,
      anonymizedAt: new Date(),
      updatedAt: new Date(),
    })
    // Réévalué après la suppression : les lignes effacées ci-dessus ne doivent pas être recomptées.
    .where(outOfRetention())
    .returning({ id: contactRequests.id })

  if (staleTenantIds.length > 0) {
    await db.delete(dossierFacileDocuments).where(inArray(dossierFacileDocuments.tenantId, staleTenantIds))
    await db
      .update(dossierFacileTenants)
      .set({ url: null, pdfUrl: null, updatedAt: new Date() })
      .where(inArray(dossierFacileTenants.id, staleTenantIds))
  }

  return { deleted: deleted.length, anonymized: anonymized.length, dossiersPurged: staleTenantIds.length }
}
