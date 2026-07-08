import { index, pgTable, text, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

/**
 * Demande de contact (« lead ») laissée par un étudiant connecté sur une résidence,
 * en mode `contacts` (coordonnées à recontacter, sans DossierFacile).
 * Le statut suit le vocabulaire partagé de `src/enums/contact-status.ts`
 * (mode contacts : `a_contacter` → `contacte` / `non_retenu`, pas de `a_moderer`).
 */
export const contactRequests = pgTable(
  'contact_request',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accommodationSlug: varchar('accommodation_slug', { length: 255 }).notNull(),
    apartmentType: text('apartment_type'),
    status: text('status').notNull().default('a_contacter'),
    reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [unique().on(t.userId, t.accommodationSlug), index('contact_request_accommodation_slug_idx').on(t.accommodationSlug)],
)
