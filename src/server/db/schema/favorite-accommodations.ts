import { bigint, index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { accommodations } from './accommodations'
import { user } from './auth'

export const favoriteAccommodations = pgTable(
  'favorite_accommodation',
  {
    id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accommodationId: bigint('accommodation_id', { mode: 'number' })
      .notNull()
      .references(() => accommodations.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (t) => [unique().on(t.userId, t.accommodationId), index('favorite_accommodation_user_id_idx').on(t.userId)],
)
