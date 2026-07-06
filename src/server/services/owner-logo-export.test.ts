import { describe, expect, it } from 'vitest'
import { buildOwnerLogoEntries, buildOwnerLogosZip, getLogoExtension, sanitizeLogoFilenameBase } from './owner-logo-export'

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
const WEBP_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])

function readLocalFilenames(zip: Buffer): string[] {
  const filenames: string[] = []
  let offset = 0

  while (zip.readUInt32LE(offset) === 0x04034b50) {
    const compressedSize = zip.readUInt32LE(offset + 18)
    const filenameLength = zip.readUInt16LE(offset + 26)
    const extraLength = zip.readUInt16LE(offset + 28)
    const filenameStart = offset + 30
    const filenameEnd = filenameStart + filenameLength
    filenames.push(zip.subarray(filenameStart, filenameEnd).toString('utf8'))
    offset = filenameEnd + extraLength + compressedSize
  }

  return filenames
}

describe('owner logo export', () => {
  it('sanitizes invalid filename characters while preserving the owner name', () => {
    expect(sanitizeLogoFilenameBase('Bailleur: A/B*', 12)).toBe('Bailleur- A-B-')
  })

  it('chooses image extensions from magic bytes', () => {
    expect(getLogoExtension(JPEG_MAGIC)).toBe('jpg')
    expect(getLogoExtension(PNG_MAGIC)).toBe('png')
    expect(getLogoExtension(WEBP_MAGIC)).toBe('webp')
    expect(getLogoExtension(Buffer.from('unknown image'))).toBe('bin')
  })

  it('builds image entries named from owner names and disambiguates duplicates', () => {
    const entries = buildOwnerLogoEntries([
      { id: 1, name: 'Bailleur A', image: PNG_MAGIC },
      { id: 2, name: 'Bailleur A', image: JPEG_MAGIC },
    ])

    expect(entries.map((entry) => entry.filename)).toEqual(['Bailleur A.png', 'Bailleur A-2.jpg'])
  })

  it('generates a zip containing logo image files', () => {
    const zip = buildOwnerLogosZip([
      { id: 1, name: 'Bailleur A', image: PNG_MAGIC },
      { id: 2, name: 'Bailleur B', image: WEBP_MAGIC },
    ])

    expect(zip.readUInt32LE(0)).toBe(0x04034b50)
    expect(readLocalFilenames(zip)).toEqual(['Bailleur A.png', 'Bailleur B.webp'])
  })
})
