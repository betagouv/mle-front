import { bigint, boolean, index, integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import { user } from './auth'

/**
 * Table gérée par le plugin `@better-auth/api-key`.
 * Les *clés de propriété* JS doivent correspondre exactement aux noms de champs attendus par
 * Better Auth (configId, referenceId, rateLimit*, requestCount…). Les noms de colonnes SQL restent
 * en snake_case pour rester cohérents avec le reste du schéma.
 *
 * Chaque clé est rattachée à l'utilisateur (admin) qui l'a créée via `referenceId`. L'identité du
 * consommateur externe (nom public, contact) est portée par `name` + `metadata`.
 */
export const apikey = pgTable(
  'apikey',
  {
    id: text().primaryKey(),
    name: text(),
    start: text(),
    prefix: text(),
    key: text().notNull(),
    referenceId: text('reference_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    configId: text('config_id').notNull().default('default'),
    refillInterval: bigint('refill_interval', { mode: 'number' }),
    refillAmount: integer('refill_amount'),
    lastRefillAt: timestamp('last_refill_at', { withTimezone: true }),
    enabled: boolean().notNull().default(true),
    rateLimitEnabled: boolean('rate_limit_enabled').notNull().default(true),
    rateLimitTimeWindow: bigint('rate_limit_time_window', { mode: 'number' }),
    rateLimitMax: integer('rate_limit_max'),
    requestCount: integer('request_count').notNull().default(0),
    remaining: integer(),
    lastRequest: timestamp('last_request', { withTimezone: true }),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    permissions: text(),
    metadata: text(),
  },
  (t) => [index('apikey_reference_id_idx').on(t.referenceId), index('apikey_key_idx').on(t.key)],
)
