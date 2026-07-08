import { NextRequest } from 'next/server'
import { buildOwnerLogosZip, getOwnerLogoRows } from '~/server/services/owner-logo-export'
import { getServerSession } from '~/services/better-auth'

export async function GET(request: NextRequest) {
  const session = await getServerSession()
  if (!session || session.user.role !== 'admin') {
    return new Response('Unauthorized', { status: 401 })
  }

  const ownerIdParam = request.nextUrl.searchParams.get('ownerId')
  let ownerId: number | undefined

  if (ownerIdParam) {
    ownerId = Number(ownerIdParam)
    if (!Number.isInteger(ownerId) || ownerId <= 0) {
      return new Response('Invalid ownerId', { status: 400 })
    }
  }

  const rows = await getOwnerLogoRows(ownerId)
  const zip = buildOwnerLogosZip(rows)
  const date = new Date().toISOString().slice(0, 10)
  const filename = ownerId ? `logo-bailleur-${ownerId}-${date}.zip` : `logos-bailleurs-${date}.zip`
  const body = zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength) as ArrayBuffer

  return new Response(body, {
    headers: {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(zip.length),
    },
  })
}
