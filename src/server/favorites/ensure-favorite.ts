import * as Sentry from '@sentry/nextjs'
import { db } from '~/server/db'
import { favoriteAccommodations } from '~/server/db/schema'

/**
 * Ajoute la résidence aux favoris de l'étudiant si elle n'y est pas déjà.
 *
 * Candidater vaut suivi de la résidence : la candidature est restituée dans l'espace étudiant via
 * la page favoris, la carte n'y apparaîtrait donc pas sans ce favori implicite. L'étudiant reste
 * libre de retirer le favori ensuite (la candidature, elle, n'est pas annulée).
 */
export const ensureFavorite = async (userId: string, accommodationId: number): Promise<void> => {
  try {
    await db.insert(favoriteAccommodations).values({ userId, accommodationId }).onConflictDoNothing()
  } catch (error) {
    // Un favori manquant ne doit jamais faire échouer la candidature elle-même.
    Sentry.captureException(error, { tags: { step: 'ensureFavorite' }, extra: { userId, accommodationId } })
  }
}
