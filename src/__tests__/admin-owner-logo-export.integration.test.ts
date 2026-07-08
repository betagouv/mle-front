import { NextRequest } from 'next/server'
import { describe, expect, it, vi } from 'vitest'
import { createOwner } from './fixtures/factories'

const mockSession = vi.hoisted(() => ({
  current: null as null | { user: { role: 'admin' | 'owner' | 'user' } },
}))

vi.mock('~/services/better-auth', () => ({
  getServerSession: vi.fn(() => mockSession.current),
}))

import { GET } from '~/app/api/admin/bailleurs/logos/export/route'

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])

function request(url: string) {
  return new NextRequest(url)
}

async function readZipFilenames(response: Response): Promise<string[]> {
  const zip = Buffer.from(await response.arrayBuffer())
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

describe('GET /api/admin/bailleurs/logos/export', () => {
  it('rejects unauthenticated users', async () => {
    mockSession.current = null

    const response = await GET(request('http://localhost/api/admin/bailleurs/logos/export'))

    expect(response.status).toBe(401)
  })

  it('rejects non-admin users', async () => {
    mockSession.current = { user: { role: 'owner' } }

    const response = await GET(request('http://localhost/api/admin/bailleurs/logos/export'))

    expect(response.status).toBe(401)
  })

  it('exports only owners with a logo for admin users', async () => {
    mockSession.current = { user: { role: 'admin' } }
    await createOwner({ name: 'Bailleur A', slug: 'bailleur-a', image: PNG_MAGIC })
    await createOwner({ name: 'Bailleur B', slug: 'bailleur-b' })
    await createOwner({ name: 'Bailleur C', slug: 'bailleur-c', image: JPEG_MAGIC })

    const response = await GET(request('http://localhost/api/admin/bailleurs/logos/export'))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toBe('application/zip')
    expect(response.headers.get('content-disposition')).toMatch(/^attachment; filename="logos-bailleurs-/)
    await expect(readZipFilenames(response)).resolves.toEqual(['Bailleur A.png', 'Bailleur C.jpg'])
  })

  it('exports a single owner logo when ownerId is provided', async () => {
    mockSession.current = { user: { role: 'admin' } }
    const ownerA = await createOwner({ name: 'Bailleur A', slug: 'bailleur-a', image: PNG_MAGIC })
    await createOwner({ name: 'Bailleur C', slug: 'bailleur-c', image: JPEG_MAGIC })

    const response = await GET(request(`http://localhost/api/admin/bailleurs/logos/export?ownerId=${ownerA.id}`))

    expect(response.status).toBe(200)
    expect(response.headers.get('content-disposition')).toMatch(new RegExp(`^attachment; filename="logo-bailleur-${ownerA.id}-`))
    await expect(readZipFilenames(response)).resolves.toEqual(['Bailleur A.png'])
  })
})
