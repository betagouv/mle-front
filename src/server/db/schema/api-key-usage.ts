import { date, integer, pgTable, primaryKey, text } from 'drizzle-orm/pg-core'
import { apikey } from './api-key'

/**
 * Agrégat journalier du volume de requêtes par clé d'API (consommateur).
 * Une ligne par clé et par jour, incrémentée à chaque requête authentifiée de l'API v1.
 * Permet de calculer le trafic par jour / semaine / mois par consommateur sans log par requête.
 */
export const apiKeyUsageDaily = pgTable(
  'api_key_usage_daily',
  {
    apiKeyId: text('api_key_id')
      .notNull()
      .references(() => apikey.id, { onDelete: 'cascade' }),
    day: date('day').notNull(),
    count: integer('count').notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.apiKeyId, t.day] })],
)
