import { writeFileSync } from 'node:fs'
import { sql } from 'drizzle-orm'
import { closeDb, db } from '~/server/db'
import { type TGeocodeDecision, resolveAddressLocation } from '~/server/lib/geocoding/resolve'

type Phase = 'geom' | 'city' | 'report'

interface BackfillOptions {
  dryRun?: boolean
  verbose?: boolean
  phase?: Phase
  limit?: number
  csv?: string
}

interface AddressRow {
  addressId: number
  slug: string
  address: string | null
  postalCode: string
  cityId: number | null
  cityName: string | null
  /** Commune où tombe réellement le point actuel (null s'il est hors de France). */
  currentInseeCode: string | null
  currentDepartment: string | null
  /** Le point actuel est-il dans la commune de son cityId ? */
  consistent: boolean
}

/**
 * Les adresses dont le point est hors de la commune de leur `cityId`. Ce sont
 * les seules dont la géométrie est à reprendre : une adresse déjà cohérente ne
 * doit jamais être déplacée, sous peine de régression (mesuré à 5 régressions
 * sur 1473 quand on réécrit tout, 0 en restreignant le périmètre).
 */
async function fetchAddresses(onlyInconsistent: boolean, limit?: number): Promise<AddressRow[]> {
  const rows = await db.execute<{
    address_id: string
    slug: string
    address: string | null
    postal_code: string
    city_id: string | null
    city_name: string | null
    current_insee_code: string | null
    current_department: string | null
    consistent: boolean | null
  }>(sql`
    SELECT aa.id                AS address_id,
           a.slug               AS slug,
           aa.address           AS address,
           aa.postal_code       AS postal_code,
           aa.city_id           AS city_id,
           c.name               AS city_name,
           loc.insee_code       AS current_insee_code,
           loc.department       AS current_department,
           CASE WHEN c.boundary IS NULL THEN NULL
                ELSE ST_Within(aa.geom, c.boundary) END AS consistent
    FROM accommodation_address aa
    JOIN accommodation a ON a.id = aa.accommodation_id
    LEFT JOIN city c ON c.id = aa.city_id
    LEFT JOIN LATERAL (
      SELECT c2.insee_codes[1] AS insee_code, d2.code AS department
      FROM city c2
      JOIN department d2 ON d2.id = c2.department_id
      WHERE aa.geom IS NOT NULL AND ST_Within(aa.geom, c2.boundary)
      LIMIT 1
    ) loc ON TRUE
    WHERE aa.postal_code IS NOT NULL
      ${onlyInconsistent ? sql`AND (aa.geom IS NULL OR c.boundary IS NULL OR NOT ST_Within(aa.geom, c.boundary))` : sql``}
    ORDER BY aa.id
    ${limit ? sql`LIMIT ${limit}` : sql``}
  `)

  return rows.map((r) => ({
    addressId: Number(r.address_id),
    slug: r.slug,
    address: r.address,
    postalCode: r.postal_code,
    cityId: r.city_id ? Number(r.city_id) : null,
    cityName: r.city_name,
    currentInseeCode: r.current_insee_code,
    currentDepartment: r.current_department,
    consistent: r.consistent === true,
  }))
}

/** Dump des valeurs actuelles, à rejouer en cas de retour arrière. */
function writeRollback(path: string, rows: { addressId: number }[]): void {
  const ids = rows.map((r) => r.addressId).join(',')
  writeFileSync(
    path,
    [
      '-- Rollback du backfill de géocodage.',
      '-- Rejouer ce SELECT AVANT le backfill pour capturer les valeurs, puis',
      '-- restaurer manuellement depuis le résultat.',
      `SELECT id, ST_AsText(geom) AS geom, city_id FROM accommodation_address WHERE id IN (${ids});`,
      '',
    ].join('\n'),
  )
}

async function applyGeom(addressId: number, lat: number, lng: number): Promise<void> {
  await db.execute(sql`
    UPDATE accommodation_address
    SET geom = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)
    WHERE id = ${addressId}
  `)
}

/** Recale le `city_id` sur la commune du code INSEE validé par la BAN. */
async function applyCityId(addressId: number, inseeCode: string): Promise<boolean> {
  const result = await db.execute<{ id: string }>(sql`
    UPDATE accommodation_address aa
    SET city_id = c.id
    FROM city c
    WHERE aa.id = ${addressId}
      AND c.insee_codes @> ARRAY[${inseeCode}]::varchar[]
      AND (aa.city_id IS NULL OR aa.city_id <> c.id)
    RETURNING aa.id
  `)
  return result.length > 0
}

export async function backfillGeocoding(options: BackfillOptions = {}): Promise<void> {
  const { dryRun = true, verbose = false, phase = 'report', limit, csv } = options

  console.log(`→ Backfill géocodage — phase « ${phase} »${dryRun ? ' (DRY-RUN, aucune écriture)' : ''}`)

  try {
    // La phase `geom` se restreint aux adresses incohérentes ; `city` et
    // `report` balaient tout, puisqu'un cityId faux n'a rien à voir avec la
    // position du point.
    const rows = await fetchAddresses(phase === 'geom', limit)
    console.log(`→ ${rows.length} adresse(s) à examiner`)

    const decisions: { row: AddressRow; decision: TGeocodeDecision }[] = []
    for (const [index, row] of rows.entries()) {
      const decision = await resolveAddressLocation({
        address: row.address ?? '',
        postalCode: row.postalCode,
        cityName: row.cityName,
        currentInseeCode: row.currentInseeCode,
        currentDepartment: row.currentDepartment,
      })
      decisions.push({ row, decision })
      if ((index + 1) % 50 === 0) console.log(`  … ${index + 1}/${rows.length}`)
    }

    const applies = decisions.filter((d) => d.decision.action === 'apply')
    const keeps = decisions.filter((d) => d.decision.action === 'keep')
    const flags = decisions.filter((d) => d.decision.action === 'flag')
    console.log(`\n  apply=${applies.length}  keep=${keeps.length}  flag=${flags.length}`)

    if (csv) {
      const lines = ['slug;code_postal;adresse;action;confiance;motif;lat;lng;insee']
      for (const { row, decision } of decisions) {
        const apply = decision.action === 'apply' ? decision : null
        lines.push(
          [
            row.slug,
            row.postalCode,
            (row.address ?? '').replace(/;/g, ','),
            decision.action,
            apply?.confidence ?? '',
            decision.reason,
            apply?.lat ?? '',
            apply?.lng ?? '',
            apply?.inseeCode ?? '',
          ].join(';'),
        )
      }
      writeFileSync(csv, `${lines.join('\n')}\n`)
      console.log(`  Rapport écrit dans ${csv}`)
    }

    if (phase === 'report') {
      console.log('\nÀ revoir manuellement :')
      for (const { row, decision } of flags) console.log(`  - ${row.slug} (${row.postalCode}) : ${decision.reason}`)
      return
    }

    if (!dryRun) writeRollback(`rollback-geocoding-${phase}.sql`, applies.map((a) => a.row))

    let changed = 0
    let unchanged = 0

    for (const { row, decision } of applies) {
      if (decision.action !== 'apply') continue

      if (phase === 'geom') {
        // Filet de sécurité : ne jamais déplacer un point déjà cohérent.
        if (row.consistent) {
          unchanged++
          continue
        }
        if (verbose) console.log(`  ${row.slug} → ${decision.lat.toFixed(5)},${decision.lng.toFixed(5)} (${decision.confidence})`)
        if (!dryRun) await applyGeom(row.addressId, decision.lat, decision.lng)
        changed++
      } else {
        if (!decision.inseeCode) {
          unchanged++
          continue
        }
        if (dryRun) {
          const [existing] = await db.execute<{ same: boolean }>(sql`
            SELECT (aa.city_id = c.id) AS same
            FROM accommodation_address aa
            JOIN city c ON c.insee_codes @> ARRAY[${decision.inseeCode}]::varchar[]
            WHERE aa.id = ${row.addressId}
            LIMIT 1
          `)
          if (existing?.same === false) {
            if (verbose) console.log(`  ${row.slug} : city_id → INSEE ${decision.inseeCode}`)
            changed++
          } else unchanged++
        } else if (await applyCityId(row.addressId, decision.inseeCode)) {
          if (verbose) console.log(`  ${row.slug} : city_id → INSEE ${decision.inseeCode}`)
          changed++
        } else unchanged++
      }
    }

    console.log(`\n✓ ${dryRun ? '[dry-run] ' : ''}${changed} ligne(s) modifiée(s), ${unchanged} inchangée(s)`)
    if (!dryRun) console.log(`  Rollback : rollback-geocoding-${phase}.sql`)
  } finally {
    await closeDb()
  }
}
