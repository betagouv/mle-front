import { and, eq, gte, isNotNull, or, type SQL } from 'drizzle-orm'
import { CONTACT_RETENTION_DAYS } from '~/enums/contact-status'
import { DF_TENANT_STATUS_VERIFIED } from '~/enums/dossier-facile-tenant-status'
import { db } from '~/server/db'
import { contactRequests, dossierFacileApplications, dossierFacileTenants } from '~/server/db/schema'

const DAY_MS = 24 * 60 * 60 * 1000

/** Début de la fenêtre de rétention : les candidatures antérieures ne sont plus restituées. */
export const contactRetentionCutoff = () => new Date(Date.now() - CONTACT_RETENTION_DAYS * DAY_MS)

/**
 * Ce que « visible du gestionnaire » veut dire, pour les deux canaux de candidature.
 *
 * Les prédicats ci-dessous servent aux **listes** ; pour atteindre une ligne précise, passer par
 * `findVisibleContactRequest` / `findVisibleApplication`, qui appliquent la même règle sans qu'on
 * puisse l'oublier. Toute lecture ou écriture portant sur une candidature doit franchir l'un des deux.
 */

/**
 * Demande de contact visible :
 * - **confirmée** — une demande visiteur n'existe pour le gestionnaire qu'une fois l'adresse prouvée
 *   par double opt-in ; les demandes liées à un compte sont confirmées d'office ;
 * - **récente** — au-delà de `CONTACT_RETENTION_DAYS` elle disparaît, conformément à ce que
 *   l'interface annonce au gestionnaire. Le cron de purge vide les coordonnées peu après.
 */
export const visibleContactRequest = (): SQL | undefined =>
  and(
    or(isNotNull(contactRequests.userId), isNotNull(contactRequests.confirmedAt)),
    gte(contactRequests.createdAt, contactRetentionCutoff()),
  )

/**
 * Candidature DossierFacile visible : même fenêtre de rétention, **et** dossier validé.
 *
 * Les deux moitiés sont volontairement inséparables — le statut du locataire était auparavant un
 * prédicat distinct que chaque lecteur devait penser à combiner, et deux d'entre eux l'oubliaient.
 * Suppose que `dossier_facile_tenant` est joint à la requête.
 */
export const visibleDossierFacileApplication = (): SQL | undefined =>
  and(gte(dossierFacileApplications.createdAt, contactRetentionCutoff()), eq(dossierFacileTenants.status, DF_TENANT_STATUS_VERIFIED))

/** La demande de contact désignée, si elle est visible du gestionnaire — `null` sinon. */
export const findVisibleContactRequest = async (id: string) => {
  const request = await db.query.contactRequests.findFirst({
    where: and(eq(contactRequests.id, id), visibleContactRequest()),
    with: { user: true, accommodation: true },
  })
  return request ?? null
}

/**
 * La candidature DossierFacile désignée, si elle est visible du gestionnaire — `null` sinon.
 *
 * La requête relationnelle ne peut pas porter le prédicat sur la table jointe : le statut du
 * locataire est donc revérifié ici, sur la ligne chargée.
 */
export const findVisibleApplication = async (id: string) => {
  const application = await db.query.dossierFacileApplications.findFirst({
    where: and(eq(dossierFacileApplications.id, id), gte(dossierFacileApplications.createdAt, contactRetentionCutoff())),
    with: { tenant: { with: { documents: true } } },
  })
  if (!application || application.tenant.status !== DF_TENANT_STATUS_VERIFIED) return null
  return application
}

/**
 * Une candidature encore visible pour ce locataire, s'il en reste une.
 *
 * C'est ce qui autorise l'accès au dossier : plus aucune candidature dans la fenêtre, plus de motif
 * pour un gestionnaire de consulter les pièces.
 */
export const findVisibleApplicationForTenant = async (tenantId: string) => {
  const application = await db.query.dossierFacileApplications.findFirst({
    where: and(eq(dossierFacileApplications.tenantId, tenantId), gte(dossierFacileApplications.createdAt, contactRetentionCutoff())),
    columns: { accommodationSlug: true },
    with: { tenant: { columns: { status: true } } },
  })
  if (!application || application.tenant.status !== DF_TENANT_STATUS_VERIFIED) return null
  return application
}
