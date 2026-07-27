import { bigint, customType, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core'
import { EOwnerContactMode } from '~/enums/owner-contact-mode'

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

export const ownerContactModeEnum = pgEnum('owner_contact_mode', [
  EOwnerContactMode.NONE,
  EOwnerContactMode.CONTACTS,
  EOwnerContactMode.DOSSIER_FACILE,
])

export const owners = pgTable('owner', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 200 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }),
  landingUrl: varchar('landing_url', { length: 500 }),
  image: bytea('image'),
  contactMode: ownerContactModeEnum('contact_mode').notNull().default(EOwnerContactMode.NONE),
})
