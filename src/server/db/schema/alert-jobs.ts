import { sql } from 'drizzle-orm'
import { bigint, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core'
import { accommodations } from './accommodations'
import { user } from './auth'
import { studentAlerts } from './student-alerts'

export const alertJobStatusEnum = pgEnum('alert_job_status', ['pending', 'sent', 'failed'])

export const alertJobs = pgTable(
  'alert_job',
  {
    id: integer().primaryKey().generatedByDefaultAsIdentity(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    studentAlertId: bigint('student_alert_id', { mode: 'number' })
      .notNull()
      .references(() => studentAlerts.id, { onDelete: 'cascade' }),
    accommodationId: bigint('accommodation_id', { mode: 'number' })
      .notNull()
      .references(() => accommodations.id, { onDelete: 'cascade' }),
    status: alertJobStatusEnum().notNull().default('pending'),
    attempts: integer().notNull().default(0),
    sentAt: timestamp('sent_at', { withTimezone: true }),
    error: text(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('alert_job_user_id_idx').on(t.userId),
    index('alert_job_status_idx').on(t.status),
    uniqueIndex('alert_job_active_unique')
      .on(t.userId, t.studentAlertId, t.accommodationId)
      .where(sql`${t.status} = 'pending' OR (${t.status} = 'failed' AND ${t.attempts} < 3)`),
  ],
)
