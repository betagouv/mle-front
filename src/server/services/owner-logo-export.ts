import { and, eq, isNotNull } from 'drizzle-orm'
import { type Zippable, zipSync } from 'fflate'
import { db } from '~/server/db'
import { owners } from '~/server/db/schema/owners'
import { detectMimeType } from '~/utils/detect-mime-type'

export type OwnerLogoExportRow = {
  id: number
  name: string
  image: Buffer
}

export type OwnerLogoEntry = {
  filename: string
  content: Buffer
}

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function sanitizeLogoFilenameBase(name: string, id: number): string {
  const sanitized = name
    .split('')
    .filter((char) => {
      const code = char.charCodeAt(0)
      return code > 31 && code !== 127
    })
    .join('')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/g, '')

  return (sanitized || `gestionnaire-${id}`).slice(0, 120)
}

export function getLogoExtension(image: Buffer): string {
  const mime = detectMimeType(image)
  return mime ? (MIME_EXTENSIONS[mime] ?? 'bin') : 'bin'
}

export function buildOwnerLogoEntries(rows: OwnerLogoExportRow[]): OwnerLogoEntry[] {
  const usedNames = new Set<string>()

  return rows.map((row) => {
    const base = sanitizeLogoFilenameBase(row.name, row.id)
    const uniqueBase = usedNames.has(base) ? `${base}-${row.id}` : base
    usedNames.add(uniqueBase)

    return {
      filename: `${uniqueBase}.${getLogoExtension(row.image)}`,
      content: row.image,
    }
  })
}

export function buildOwnerLogosZip(rows: OwnerLogoExportRow[]): Buffer {
  const files: Zippable = {}

  for (const entry of buildOwnerLogoEntries(rows)) {
    // level 0 (stored) : les images sont déjà compressées, recompresser ne gagnerait rien
    files[entry.filename] = [new Uint8Array(entry.content), { level: 0 }]
  }

  return Buffer.from(zipSync(files))
}

export async function getOwnerLogoRows(ownerId?: number): Promise<OwnerLogoExportRow[]> {
  const where = ownerId ? and(eq(owners.id, ownerId), isNotNull(owners.image)) : isNotNull(owners.image)
  const rows = await db
    .select({
      id: owners.id,
      name: owners.name,
      image: owners.image,
    })
    .from(owners)
    .where(where)
    .orderBy(owners.name)

  return rows.flatMap((row) => (row.image ? [{ id: row.id, name: row.name, image: row.image }] : []))
}
