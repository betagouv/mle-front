import { TRPCError } from '@trpc/server'
import { and, asc, count, desc, eq, gt, ilike, inArray, ne, or, sql } from 'drizzle-orm'
import { sanitize } from 'isomorphic-dompurify'
import { SignJWT } from 'jose'

import { z } from 'zod'
import { ZCreateResidence } from '~/schemas/accommodations/create-residence'
import { getTypologyLabel } from '~/schemas/accommodations/typology'
import { ZUpdateResidence } from '~/schemas/accommodations/update-residence'
import { ZUpdateResidenceList } from '~/schemas/accommodations/update-residence-list'
import { zCreateBailleurUser, zUpdateBailleurUser } from '~/schemas/bailleur-users/bailleur-user-form'
import { getOwnerForUser } from '~/server/bailleur/get-owner-for-user'
import { ADMIN_ONLY_PERMISSIONS, canGrantAdministratorRights } from '~/server/bailleur/permissions'
import { db } from '~/server/db'
import { accommodationAddresses } from '~/server/db/schema/accommodation-addresses'
import { accommodationTypologies } from '~/server/db/schema/accommodation-typologies'
import { accommodations } from '~/server/db/schema/accommodations'
import { user } from '~/server/db/schema/auth'
import { cities } from '~/server/db/schema/cities'
import { dossierFacileApplications, dossierFacileDocuments, dossierFacileTenants } from '~/server/db/schema/dossier-facile'
import { owners } from '~/server/db/schema/owners'
import { persistTypologies, typologyAggregates } from '~/server/lib/typologies'
import { classifyActions, computeDiff } from '~/server/services/accommodation-diff'
import { logActivity } from '~/server/services/activity-logger'
import { triggerAlertDetection } from '~/server/services/alert-detection-trigger'
import { sendOwnerWelcomeEmail, syncBrevoDataUpdated } from '~/server/services/brevo'
import { generateSlug, geocodeAddress } from '~/server/trpc/utils/accommodation-helpers'
import { resolveCityId } from '~/server/trpc/utils/resolve-city'
import { getJwtSecret } from '~/server/utils/jwt-secret'
import { findAvailableSlug } from '~/server/utils/slug'
import { normalizeAccommodationName } from '~/utils/normalize-accommodation-name'
import { RICH_TEXT_ALLOWED_ATTR, RICH_TEXT_ALLOWED_TAGS } from '~/utils/sanitize-config'
import { bailleurProcedure, createTRPCRouter, ownerProcedure } from '../init'
import { priceMaxComputed, rowsToAccommodationDTOs } from './accommodations'

async function verifyOwnerAccess(userId: string, accommodationSlug: string) {
  const usr = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: { owner: true },
  })
  const isAdmin = usr?.role === 'admin'

  const [accommodation] = await db
    .select({ ownerId: accommodations.ownerId })
    .from(accommodations)
    .where(eq(accommodations.slug, accommodationSlug))
    .limit(1)

  if (!accommodation) throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found' })
  if (!isAdmin && (!usr?.owner || accommodation.ownerId !== usr.owner.id)) {
    throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this accommodation' })
  }
}

async function verifyOwnership(slug: string, userId: string) {
  const usr = await db.query.user.findFirst({
    where: eq(user.id, userId),
    with: { owner: true },
  })

  const isAdmin = usr?.role === 'admin'

  if (!isAdmin) {
    const owner = usr?.owner ?? null
    if (!owner) {
      throw new TRPCError({ code: 'FORBIDDEN', message: 'No owner record for this user' })
    }

    const [accommodation] = await db
      .select({ id: accommodations.id })
      .from(accommodations)
      .where(and(eq(accommodations.slug, slug), eq(accommodations.ownerId, owner.id)))
      .limit(1)

    if (!accommodation) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found or not owned by you' })
    }

    return { owner, accommodationId: accommodation.id }
  }

  // Admin: find accommodation without ownership check
  const [accommodation] = await db
    .select({ id: accommodations.id, ownerId: accommodations.ownerId })
    .from(accommodations)
    .where(eq(accommodations.slug, slug))
    .limit(1)

  if (!accommodation) {
    throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found' })
  }

  // Resolve the accommodation's owner for the return value
  const owner = accommodation.ownerId ? await db.query.owners.findFirst({ where: eq(owners.id, accommodation.ownerId) }) : null

  return { owner: owner ?? usr?.owner ?? null, accommodationId: accommodation.id }
}

const PAGE_SIZE = 20

const accommodationSelectFields = {
  id: accommodations.id,
  name: accommodations.name,
  slug: accommodations.slug,
  description: accommodations.description,
  rentalChargesDetails: accommodations.rentalChargesDetails,
  address: accommodationAddresses.address,
  city: cities.name,
  postalCode: accommodationAddresses.postalCode,
  residenceType: accommodations.residenceType,
  targetAudience: accommodations.targetAudience,
  published: accommodations.published,
  nbTotalApartments: accommodations.nbTotalApartments,
  nbAccessibleApartments: accommodations.nbAccessibleApartments,
  nbColivingApartments: accommodations.nbColivingApartments,
  priceMin: accommodations.priceMin,
  priceMaxComputed,
  acceptWaitingList: accommodations.acceptWaitingList,
  scholarshipHoldersPriority: accommodations.scholarshipHoldersPriority,
  socialHousingRequired: accommodations.socialHousingRequired,
  wifi: accommodations.wifi,
  imagesUrls: accommodations.imagesUrls,
  externalUrl: accommodations.externalUrl,
  virtualTourUrl: accommodations.virtualTourUrl,
  updatedAt: accommodations.updatedAt,
  ownerName: owners.name,
  ownerUrl: owners.url,
  lat: sql<number>`ST_Y(${accommodationAddresses.geom}::geometry)`,
  lng: sql<number>`ST_X(${accommodationAddresses.geom}::geometry)`,
} as const

export const bailleurRouter = createTRPCRouter({
  list: ownerProcedure
    .input(
      z.object({
        page: z.number().default(1),
        search: z.string().optional(),
        hasAvailability: z.boolean().optional(),
        ownerId: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const owner = await getOwnerForUser(userId, input.ownerId)

      if (!owner) {
        return {
          count: 0,
          pageSize: PAGE_SIZE,
          next: null,
          previous: null,
          minPrice: null,
          maxPrice: null,
          results: [],
        }
      }

      const conditions = [eq(accommodations.ownerId, owner.id)]

      if (input.search && input.search.length >= 3) {
        // Search joins through addresses to match city name
        conditions.push(or(ilike(accommodations.name, `%${input.search}%`), ilike(cities.name, `%${input.search}%`))!)
      }

      if (input.hasAvailability) {
        conditions.push(gt(accommodations.nbAvailableApartments, 0))
      }

      const where = and(...conditions)
      const offset = (input.page - 1) * PAGE_SIZE

      const [countResult, priceBounds, results] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(accommodations)
          .innerJoin(
            accommodationAddresses,
            and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
          )
          .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
          .where(where),
        db
          .select({
            minPrice: sql<number | null>`MIN(${accommodations.priceMin})`,
            maxPrice: sql<number | null>`MAX(${priceMaxComputed})`,
          })
          .from(accommodations)
          .innerJoin(
            accommodationAddresses,
            and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
          )
          .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
          .where(where),
        db
          .select(accommodationSelectFields)
          .from(accommodations)
          .innerJoin(
            accommodationAddresses,
            and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
          )
          .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
          .leftJoin(owners, eq(accommodations.ownerId, owners.id))
          .where(where)
          .orderBy(accommodations.name)
          .limit(PAGE_SIZE)
          .offset(offset),
      ])

      const count = countResult[0]?.count ?? 0
      const totalPages = Math.ceil(count / PAGE_SIZE)

      return {
        count,
        pageSize: PAGE_SIZE,
        next: input.page < totalPages ? String(input.page + 1) : null,
        previous: input.page > 1 ? String(input.page - 1) : null,
        minPrice: priceBounds[0]?.minPrice != null ? Number(priceBounds[0].minPrice) : null,
        maxPrice: priceBounds[0]?.maxPrice != null ? Number(priceBounds[0].maxPrice) : null,
        results: await rowsToAccommodationDTOs(results),
      }
    }),
  create: bailleurProcedure('manage_residences')
    .input(
      ZCreateResidence.omit({ imagesFiles: true }).extend({
        name: z.string().min(1, 'Le nom de la résidence est requis'),
        ownerId: z.number().int().positive().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const owner = await getOwnerForUser(userId, input.ownerId)
      if (!owner) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'No owner record for this user' })
      }

      const { typologies, name, addresses, ...fields } = input

      const slug = await findAvailableSlug(generateSlug(name), db, accommodations)

      // Denormalized aggregates computed from the typology array (child rows persisted below).
      const aggregates = typologyAggregates(typologies)

      const insertValues: typeof accommodations.$inferInsert = {
        name: normalizeAccommodationName(name),
        slug,
        residenceType: fields.residenceType ?? null,
        targetAudience: fields.targetAudience ?? null,
        description: fields.description
          ? sanitize(fields.description, { ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS, ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR })
          : null,
        rentalChargesDetails: fields.rentalChargesDetails ?? null,
        externalUrl: fields.externalUrl || null,
        acceptWaitingList: fields.acceptWaitingList ?? false,
        published: fields.published ?? false,
        scholarshipHoldersPriority: fields.scholarshipHoldersPriority ?? false,
        socialHousingRequired: fields.socialHousingRequired ?? false,
        ownerId: owner.id,
        nbTotalApartments: aggregates.nbTotalApartments,
        priceMin: aggregates.priceMin,
        priceMax: aggregates.priceMax,
        nbAvailableApartments: aggregates.nbAvailableApartments,
        imagesUrls: [],
        // Independent (caller-set) aggregates, not derived from typologies
        nbAccessibleApartments: 0,
        nbColivingApartments: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const created = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(accommodations)
          .values(insertValues)
          .returning({ id: accommodations.id, slug: accommodations.slug, name: accommodations.name })
        await persistTypologies(tx, row.id, typologies)
        return row
      })

      // Geocode + resolve cities in parallel, then batch insert
      const resolved = await Promise.all(
        addresses.map(async (addr, i) => {
          const [coords, cityId] = await Promise.all([
            geocodeAddress(addr.address, addr.city, addr.postalCode),
            resolveCityId(addr.postalCode, addr.city),
          ])
          const values: typeof accommodationAddresses.$inferInsert = {
            accommodationId: created.id,
            isMain: i === 0,
            address: addr.address,
            postalCode: addr.postalCode,
            cityId,
          }
          if (coords) {
            ;(values as Record<string, unknown>).geom = sql`ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)`
          }
          return values
        }),
      )
      await db.insert(accommodationAddresses).values(resolved)

      await logActivity({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name,
        action: 'accommodation.created',
        entityType: 'accommodation',
        entityName: created.name,
        ownerId: owner.id,
        ownerName: owner.name,
        metadata: { slug: created.slug },
      })

      await triggerAlertDetection([created.id])

      return { slug: created.slug }
    }),

  update: bailleurProcedure('manage_residences')
    .input(z.object({ slug: z.string() }).merge(ZUpdateResidence))
    .mutation(async ({ ctx, input }) => {
      const { slug, addresses: inputAddresses, typologies, ...fields } = input
      const { owner, accommodationId } = await verifyOwnership(slug, ctx.session.user.id)

      // Snapshot current state for diff
      const [snapshot] = await db.select().from(accommodations).where(eq(accommodations.slug, slug)).limit(1)

      // Input fields are already camelCase = DB column names, so no snake→camel mapping is needed.
      const camelFields: Record<string, unknown> = { ...fields }
      if (typeof camelFields.name === 'string') {
        camelFields.name = normalizeAccommodationName(camelFields.name)
      }
      if (typeof camelFields.description === 'string') {
        camelFields.description = sanitize(camelFields.description, {
          ALLOWED_TAGS: RICH_TEXT_ALLOWED_TAGS,
          ALLOWED_ATTR: RICH_TEXT_ALLOWED_ATTR,
        })
      }
      const userProvidedKeys = new Set(Object.keys(camelFields))
      const parentSet: Record<string, unknown> = { ...camelFields }

      // When typologies are provided, refresh the denormalized parent aggregates.
      if (typologies) {
        const aggregates = typologyAggregates(typologies)
        parentSet.nbTotalApartments = aggregates.nbTotalApartments
        parentSet.priceMin = aggregates.priceMin
        parentSet.priceMax = aggregates.priceMax
        parentSet.nbAvailableApartments = aggregates.nbAvailableApartments
      }

      // Handle addresses update
      if (inputAddresses !== undefined) {
        // Geocode in parallel, then delete old + batch insert
        const resolved = await Promise.all(
          inputAddresses.map(async (addr, i) => {
            const [coords, cityId] = await Promise.all([
              geocodeAddress(addr.address, addr.city, addr.postalCode),
              resolveCityId(addr.postalCode, addr.city),
            ])
            const values: typeof accommodationAddresses.$inferInsert = {
              accommodationId,
              isMain: i === 0,
              address: addr.address,
              postalCode: addr.postalCode,
              cityId,
            }
            if (coords) {
              ;(values as Record<string, unknown>).geom = sql`ST_SetSRID(ST_MakePoint(${coords.lon}, ${coords.lat}), 4326)`
            }
            return values
          }),
        )
        await db.delete(accommodationAddresses).where(eq(accommodationAddresses.accommodationId, accommodationId))
        await db.insert(accommodationAddresses).values(resolved)
      }

      parentSet.updatedAt = new Date()

      const updated = await db.transaction(async (tx) => {
        if (typologies) await persistTypologies(tx, accommodationId, typologies)
        const [row] = await tx
          .update(accommodations)
          .set(parentSet)
          .where(eq(accommodations.slug, slug))
          .returning({ slug: accommodations.slug, name: accommodations.name })
        return row
      })

      if (snapshot) {
        const diff = computeDiff(snapshot as Record<string, unknown>, camelFields, userProvidedKeys)
        for (const { action, diff: actionDiff } of classifyActions(diff)) {
          await logActivity({
            userId: ctx.session.user.id,
            userName: ctx.session.user.name,
            action,
            entityType: 'accommodation',
            entityName: updated.name,
            ownerId: owner?.id,
            ownerName: owner?.name,
            metadata: { slug: updated.slug, diff: actionDiff },
          })
        }
      }

      // Les disponibilités passent désormais par les typologies : on redéclenche la détection d'alertes
      // dès qu'un lot de typologies est fourni (superset sûr — la détection recompute de toute façon).
      if (typologies !== undefined) {
        await triggerAlertDetection([accommodationId])
      }

      return updated
    }),

  updateAvailability: bailleurProcedure('manage_availability')
    .input(z.object({ slug: z.string() }).merge(ZUpdateResidenceList))
    .mutation(async ({ ctx, input }) => {
      const { slug, availability } = input
      const { owner, accommodationId } = await verifyOwnership(slug, ctx.session.user.id)

      // Overlay the new availability onto the current typology rows by type, then recompute aggregates.
      const currentRows = await db
        .select()
        .from(accommodationTypologies)
        .where(eq(accommodationTypologies.accommodationId, accommodationId))
      const availByType = new Map(availability.map((a) => [a.type, a.nbAvailable]))

      // Validation serveur (miroir du client `createUpdateResidenceListSchema`) : la dispo ne peut
      // dépasser le total de la typologie, et une typologie sans total ne peut recevoir de dispo.
      const totalByType = new Map(currentRows.map((r) => [r.type, r.nbTotal]))
      for (const entry of availability) {
        if (entry.nbAvailable == null) continue
        const total = totalByType.get(entry.type) ?? null
        if (total == null) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Veuillez d'abord renseigner le nombre total de logements ${getTypologyLabel(entry.type)}`,
          })
        }
        if (entry.nbAvailable > total) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: `Le nombre de logements ${getTypologyLabel(entry.type)} disponibles ne peut pas être supérieur au nombre total (${total})`,
          })
        }
      }

      const newTypologies = currentRows.map((r) => ({
        type: r.type,
        priceMin: r.priceMin,
        priceMax: r.priceMax,
        superficieMin: r.superficieMin,
        superficieMax: r.superficieMax,
        nbTotal: r.nbTotal,
        nbAvailable: availByType.has(r.type) ? (availByType.get(r.type) ?? null) : r.nbAvailable,
        colocation: r.colocation,
      }))
      const aggregates = typologyAggregates(newTypologies)

      const updated = await db.transaction(async (tx) => {
        await persistTypologies(tx, accommodationId, newTypologies)
        const [row] = await tx
          .update(accommodations)
          .set({
            nbTotalApartments: aggregates.nbTotalApartments,
            priceMin: aggregates.priceMin,
            priceMax: aggregates.priceMax,
            nbAvailableApartments: aggregates.nbAvailableApartments,
            updatedAt: new Date(),
          })
          .where(eq(accommodations.slug, slug))
          .returning({ slug: accommodations.slug, name: accommodations.name })
        return row
      })

      await logActivity({
        userId: ctx.session.user.id,
        userName: ctx.session.user.name,
        action: 'accommodation.availability_updated',
        entityType: 'accommodation',
        entityName: updated.name,
        ownerId: owner?.id,
        ownerName: owner?.name,
        metadata: { slug: updated.slug },
      })

      // Sync Brevo : si toutes les résidences du owner ont au moins une dispo renseignée
      try {
        if (!owner) throw new Error('Owner introuvable pour la sync Brevo')

        const residencesWithoutAvailability = await db
          .select({ slug: accommodations.slug })
          .from(accommodations)
          .where(and(eq(accommodations.ownerId, owner.id), sql`${accommodations.nbAvailableApartments} IS NULL`))
          .limit(1)

        if (residencesWithoutAvailability.length === 0) {
          await syncBrevoDataUpdated(ctx.session.user.email)
        }
      } catch (err) {
        console.error('Erreur sync Brevo DATE_DERNIERE_MAJ_DONNEES', err)
      }

      await triggerAlertDetection([accommodationId])

      return updated
    }),

  listCandidatures: bailleurProcedure('manage_applications')
    .input(
      z.object({
        page: z.number().default(1),
        status: z.enum(['pending', 'accepted', 'rejected']).optional(),
        search: z.string().optional(),
        sort: z.enum(['date_desc', 'date_asc']).default('date_desc'),
      }),
    )
    .query(async ({ ctx, input }) => {
      const owner = await getOwnerForUser(ctx.session.user.id)

      if (!owner) {
        return { items: [], total: 0, page: input.page, pageSize: PAGE_SIZE }
      }

      const ownerAccommodations = await db
        .select({ slug: accommodations.slug })
        .from(accommodations)
        .where(eq(accommodations.ownerId, owner.id))

      const slugs = ownerAccommodations.map((a) => a.slug)

      if (slugs.length === 0) {
        return { items: [], total: 0, page: input.page, pageSize: PAGE_SIZE }
      }

      const conditions = [inArray(dossierFacileApplications.accommodationSlug, slugs)]

      if (input.status) {
        conditions.push(eq(dossierFacileApplications.status, input.status))
      }

      if (input.search && input.search.length >= 2) {
        conditions.push(or(ilike(user.name, `%${input.search}%`), ilike(accommodations.name, `%${input.search}%`))!)
      }

      const where = and(...conditions)
      const offset = (input.page - 1) * PAGE_SIZE
      const orderBy = input.sort === 'date_asc' ? asc(dossierFacileApplications.createdAt) : desc(dossierFacileApplications.createdAt)

      const [countResult, results] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(dossierFacileApplications)
          .leftJoin(dossierFacileTenants, eq(dossierFacileApplications.tenantId, dossierFacileTenants.id))
          .leftJoin(user, eq(dossierFacileTenants.userId, user.id))
          .leftJoin(accommodations, eq(dossierFacileApplications.accommodationSlug, accommodations.slug))
          .where(where),
        db
          .select({
            id: dossierFacileApplications.id,
            studentName: user.name,
            studentEmail: user.email,
            residence: accommodations.name,
            apartmentType: dossierFacileApplications.apartmentType,
            status: dossierFacileApplications.status,
            createdAt: dossierFacileApplications.createdAt,
            accommodationSlug: dossierFacileApplications.accommodationSlug,
          })
          .from(dossierFacileApplications)
          .leftJoin(dossierFacileTenants, eq(dossierFacileApplications.tenantId, dossierFacileTenants.id))
          .leftJoin(user, eq(dossierFacileTenants.userId, user.id))
          .leftJoin(accommodations, eq(dossierFacileApplications.accommodationSlug, accommodations.slug))
          .where(where)
          .orderBy(orderBy)
          .limit(PAGE_SIZE)
          .offset(offset),
      ])

      const total = countResult[0]?.count ?? 0

      return {
        items: results,
        total,
        page: input.page,
        pageSize: PAGE_SIZE,
      }
    }),

  getCandidature: bailleurProcedure('manage_applications')
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const application = await db.query.dossierFacileApplications.findFirst({
        where: eq(dossierFacileApplications.id, input.id),
        with: {
          tenant: {
            with: {
              documents: true,
            },
          },
        },
      })

      if (!application) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidature not found' })
      }

      const usr = await db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
        with: { owner: true },
      })

      const isAdmin = usr?.role === 'admin'

      const [accommodation] = await db
        .select({ ...accommodationSelectFields, ownerId: accommodations.ownerId })
        .from(accommodations)
        .innerJoin(
          accommodationAddresses,
          and(eq(accommodationAddresses.accommodationId, accommodations.id), eq(accommodationAddresses.isMain, true)),
        )
        .innerJoin(cities, eq(accommodationAddresses.cityId, cities.id))
        .leftJoin(owners, eq(accommodations.ownerId, owners.id))
        .where(eq(accommodations.slug, application.accommodationSlug))
        .limit(1)

      if (!accommodation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found' })
      }

      if (!isAdmin && (!usr?.owner || accommodation.ownerId !== usr.owner.id)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this accommodation' })
      }

      const tenantUser = await db.query.user.findFirst({
        where: eq(user.id, application.tenant.userId),
      })

      const tenantDocs = application.tenant.documents ?? []

      return {
        id: application.id,
        status: application.status,
        apartmentType: application.apartmentType,
        createdAt: application.createdAt,
        reviewedAt: application.reviewedAt,
        studentName: application.tenant.name ?? tenantUser?.name ?? null,
        studentEmail: tenantUser?.email ?? null,
        dfTenantId: application.tenant.id,
        hasTenantUrl: !!application.tenant.url,
        hasPdfUrl: !!application.tenant.pdfUrl,
        tenantStatus: application.tenant.status,
        guarantorCount: application.tenant.guarantorCount ?? 0,
        documents: {
          tenant: tenantDocs.filter((d) => d.ownerType === 'tenant').map(({ url: _url, ...rest }) => rest),
          guarantor: tenantDocs.filter((d) => d.ownerType === 'guarantor').map(({ url: _url, ...rest }) => rest),
        },
        accommodation: (await rowsToAccommodationDTOs([accommodation]))[0],
      }
    }),

  getDocumentSignedUrl: bailleurProcedure('manage_applications')
    .input(
      z.object({
        type: z.enum(['tenantPdf', 'tenantUrl', 'document']),
        tenantId: z.string().uuid().optional(),
        documentId: z.string().uuid().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const REDIRECT_TTL = '60s'

      let targetId: string

      if (input.type === 'document') {
        if (!input.documentId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'documentId is required' })

        const doc = await db.query.dossierFacileDocuments.findFirst({
          where: eq(dossierFacileDocuments.id, input.documentId),
          columns: { id: true, tenantId: true },
        })
        if (!doc) throw new TRPCError({ code: 'NOT_FOUND', message: 'Document not found' })

        // Verify access via tenant
        const tenant = await db.query.dossierFacileTenants.findFirst({
          where: eq(dossierFacileTenants.id, doc.tenantId),
          columns: { id: true },
        })
        if (!tenant) throw new TRPCError({ code: 'NOT_FOUND' })

        const application = await db.query.dossierFacileApplications.findFirst({
          where: eq(dossierFacileApplications.tenantId, tenant.id),
          columns: { accommodationSlug: true },
        })
        if (!application) throw new TRPCError({ code: 'NOT_FOUND' })

        await verifyOwnerAccess(ctx.session.user.id, application.accommodationSlug)
        targetId = input.documentId
      } else {
        if (!input.tenantId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'tenantId is required' })

        const application = await db.query.dossierFacileApplications.findFirst({
          where: eq(dossierFacileApplications.tenantId, input.tenantId),
          columns: { accommodationSlug: true },
        })
        if (!application) throw new TRPCError({ code: 'NOT_FOUND' })

        await verifyOwnerAccess(ctx.session.user.id, application.accommodationSlug)
        targetId = input.tenantId
      }

      const token = await new SignJWT({ urlType: input.type, targetId })
        .setProtectedHeader({ alg: 'HS256' })
        .setSubject(ctx.session.user.id)
        .setExpirationTime(REDIRECT_TTL)
        .setIssuedAt()
        .sign(getJwtSecret())

      return { redirectUrl: `/api/df-redirect?token=${token}` }
    }),

  updateCandidatureStatus: bailleurProcedure('manage_applications')
    .input(
      z.object({
        id: z.string().uuid(),
        status: z.enum(['accepted', 'rejected']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const application = await db.query.dossierFacileApplications.findFirst({
        where: eq(dossierFacileApplications.id, input.id),
      })

      if (!application) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Candidature not found' })
      }

      const usr = await db.query.user.findFirst({
        where: eq(user.id, ctx.session.user.id),
        with: { owner: true },
      })

      const isAdmin = usr?.role === 'admin'

      const [accommodation] = await db
        .select({ ownerId: accommodations.ownerId })
        .from(accommodations)
        .where(eq(accommodations.slug, application.accommodationSlug))
        .limit(1)

      if (!accommodation) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Accommodation not found' })
      }

      if (!isAdmin && (!usr?.owner || accommodation.ownerId !== usr.owner.id)) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You do not own this accommodation' })
      }

      const [updated] = await db
        .update(dossierFacileApplications)
        .set({
          status: input.status,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(dossierFacileApplications.id, input.id))
        .returning()

      return updated
    }),

  users: createTRPCRouter({
    list: bailleurProcedure('manage_users')
      .input(z.object({ ownerId: z.number().optional(), search: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const owner = await getOwnerForUser(ctx.session.user.id, input.ownerId)
        if (!owner) return { items: [] }

        const conditions = [eq(user.ownerId, owner.id), eq(user.role, 'owner')]
        if (input.search && input.search.length >= 2) {
          const searchCondition = or(
            ilike(user.email, `%${input.search}%`),
            ilike(user.firstname, `%${input.search}%`),
            ilike(user.lastname, `%${input.search}%`),
          )
          if (searchCondition) conditions.push(searchCondition)
        }

        const items = await db
          .select({
            id: user.id,
            email: user.email,
            firstname: user.firstname,
            lastname: user.lastname,
            bailleurRole: user.bailleurRole,
            bailleurPermissions: user.bailleurPermissions,
            createdAt: user.createdAt,
          })
          .from(user)
          .where(and(...conditions))
          .orderBy(user.firstname, user.lastname)

        return { items, ownerId: owner.id }
      }),

    getById: bailleurProcedure('manage_users')
      .input(z.object({ id: z.string(), ownerId: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        const owner = await getOwnerForUser(ctx.session.user.id, input.ownerId)
        if (!owner) throw new TRPCError({ code: 'FORBIDDEN' })

        const target = await db.query.user.findFirst({
          where: and(eq(user.id, input.id), eq(user.ownerId, owner.id), eq(user.role, 'owner')),
        })
        if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur non trouve' })

        return {
          id: target.id,
          email: target.email,
          firstname: target.firstname,
          lastname: target.lastname,
          bailleurRole: target.bailleurRole,
          bailleurPermissions: target.bailleurPermissions,
        }
      }),

    create: bailleurProcedure('manage_users')
      .input(zCreateBailleurUser.extend({ ownerId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const owner = await getOwnerForUser(ctx.session.user.id, input.ownerId)
        if (!owner) throw new TRPCError({ code: 'FORBIDDEN', message: 'Bailleur introuvable' })

        const callerCanGrantAdminRights = canGrantAdministratorRights({
          role: ctx.session.user.role,
          bailleurRole: ctx.session.user.bailleurRole ?? null,
          bailleurPermissions: ctx.session.user.bailleurPermissions ?? [],
        })

        if (!callerCanGrantAdminRights) {
          if (input.bailleurRole === 'administrator') {
            throw new TRPCError({ code: 'FORBIDDEN', message: 'Seul un administrateur peut creer un autre administrateur' })
          }
          const sensitiveRequested = input.bailleurPermissions.filter((p) => ADMIN_ONLY_PERMISSIONS.includes(p))
          if (sensitiveRequested.length > 0) {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: `Seul un administrateur peut accorder ces permissions: ${sensitiveRequested.join(', ')}`,
            })
          }
        }

        const existing = await db.query.user.findFirst({ where: eq(user.email, input.email) })
        if (existing) {
          throw new TRPCError({ code: 'CONFLICT', message: 'Un utilisateur existe deja avec cet email' })
        }

        const id = crypto.randomUUID()
        const [created] = await db
          .insert(user)
          .values({
            id,
            email: input.email,
            name: `${input.firstname} ${input.lastname}`,
            firstname: input.firstname,
            lastname: input.lastname,
            role: 'owner',
            ownerId: owner.id,
            bailleurRole: input.bailleurRole,
            bailleurPermissions: input.bailleurRole === 'administrator' ? [] : input.bailleurPermissions,
          })
          .returning()

        try {
          await sendOwnerWelcomeEmail(created.email, { firstname: input.firstname, lastname: input.lastname })
        } catch (err) {
          console.error('Erreur envoi email bienvenue gestionnaire', err)
        }

        return created
      }),

    update: bailleurProcedure('manage_users')
      .input(zUpdateBailleurUser.extend({ ownerId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        const owner = await getOwnerForUser(ctx.session.user.id, input.ownerId)
        if (!owner) throw new TRPCError({ code: 'FORBIDDEN', message: 'Bailleur introuvable' })

        const target = await db.query.user.findFirst({
          where: and(eq(user.id, input.id), eq(user.ownerId, owner.id), eq(user.role, 'owner')),
        })
        if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur non trouve' })

        const callerCanGrantAdminRights = canGrantAdministratorRights({
          role: ctx.session.user.role,
          bailleurRole: ctx.session.user.bailleurRole ?? null,
          bailleurPermissions: ctx.session.user.bailleurPermissions ?? [],
        })

        if (!callerCanGrantAdminRights) {
          if (input.bailleurRole === 'administrator') {
            throw new TRPCError({
              code: 'FORBIDDEN',
              message: 'Seul un administrateur peut promouvoir un utilisateur au role administrateur',
            })
          }
          if (input.bailleurPermissions !== undefined) {
            const sensitiveRequested = input.bailleurPermissions.filter((p) => ADMIN_ONLY_PERMISSIONS.includes(p))
            if (sensitiveRequested.length > 0) {
              throw new TRPCError({
                code: 'FORBIDDEN',
                message: `Seul un administrateur peut accorder ces permissions: ${sensitiveRequested.join(', ')}`,
              })
            }
          }
        }

        const updateData: Record<string, unknown> = { updatedAt: new Date() }
        if (input.firstname !== undefined) updateData.firstname = input.firstname
        if (input.lastname !== undefined) updateData.lastname = input.lastname
        if (input.firstname !== undefined || input.lastname !== undefined) {
          updateData.name = `${input.firstname ?? target.firstname} ${input.lastname ?? target.lastname}`
        }
        if (input.bailleurRole !== undefined) {
          updateData.bailleurRole = input.bailleurRole
          if (input.bailleurRole === 'administrator') {
            updateData.bailleurPermissions = []
          }
        }
        if (input.bailleurPermissions !== undefined && input.bailleurRole !== 'administrator') {
          updateData.bailleurPermissions = input.bailleurPermissions
        }

        if (target.id === ctx.session.user.id && updateData.bailleurRole && updateData.bailleurRole !== 'administrator') {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez pas retirer votre propre role administrateur' })
        }

        const [updated] = await db.update(user).set(updateData).where(eq(user.id, input.id)).returning()
        return updated
      }),

    delete: bailleurProcedure('manage_users')
      .input(z.object({ id: z.string(), ownerId: z.number().optional() }))
      .mutation(async ({ ctx, input }) => {
        if (input.id === ctx.session.user.id) {
          throw new TRPCError({ code: 'BAD_REQUEST', message: 'Vous ne pouvez pas vous supprimer vous-meme' })
        }

        const owner = await getOwnerForUser(ctx.session.user.id, input.ownerId)
        if (!owner) throw new TRPCError({ code: 'FORBIDDEN', message: 'Bailleur introuvable' })

        const target = await db.query.user.findFirst({
          where: and(eq(user.id, input.id), eq(user.ownerId, owner.id), eq(user.role, 'owner')),
        })
        if (!target) throw new TRPCError({ code: 'NOT_FOUND', message: 'Utilisateur non trouve' })

        if (target.bailleurRole === 'administrator') {
          const [{ administratorCount }] = await db
            .select({ administratorCount: count() })
            .from(user)
            .where(and(eq(user.ownerId, owner.id), eq(user.bailleurRole, 'administrator'), ne(user.id, target.id)))

          if (administratorCount === 0) {
            throw new TRPCError({
              code: 'BAD_REQUEST',
              message: 'Impossible de supprimer le dernier administrateur du bailleur',
            })
          }
        }

        await db.delete(user).where(eq(user.id, input.id))
        return { id: input.id }
      }),
  }),
})
