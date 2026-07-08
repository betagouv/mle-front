import { bigint, customType, pgEnum, pgTable, varchar } from 'drizzle-orm/pg-core'

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType() {
    return 'bytea'
  },
})

// Mode de réception des candidatures : aucun, coordonnées à recontacter, ou dossier complet DossierFacile.
export const ownerContactModeEnum = pgEnum('owner_contact_mode', ['none', 'contacts', 'dossier_facile'])

export const owners = pgTable('owner', {
  id: bigint({ mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  name: varchar({ length: 200 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  url: varchar({ length: 500 }),
  landingUrl: varchar('landing_url', { length: 500 }),
  image: bytea('image'),
  contactMode: ownerContactModeEnum('contact_mode').notNull().default('none'),
})
