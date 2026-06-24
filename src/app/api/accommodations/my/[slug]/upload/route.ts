import * as Sentry from '@sentry/nextjs'
import { and, eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { db } from '~/server/db'
import { accommodations } from '~/server/db/schema/accommodations'
import { generateAccommodationKey, uploadFile } from '~/server/services/s3'
import { getServerSession } from '~/services/better-auth'
import { detectMimeType } from '~/utils/detect-mime-type'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export async function POST(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const auth = await getServerSession()
  if (!auth || !auth.session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { role, owner } = auth.user

  // 1. Seuls les bailleurs et admins peuvent uploader
  if (role === 'user') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { slug } = await params

  // 2. Vérifier que l'accommodation appartient au bailleur connecté (admins exemptés)
  if (role !== 'admin') {
    if (!owner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const [accommodation] = await db
      .select({ id: accommodations.id })
      .from(accommodations)
      .where(and(eq(accommodations.slug, slug), eq(accommodations.ownerId, owner.id)))
      .limit(1)
    if (!accommodation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
  }

  try {
    const formData = await request.formData()
    const files = formData.getAll('images') as File[]

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        return NextResponse.json({ error: `Type de fichier non supporté: ${file.type}. Types acceptés: jpeg, png, webp` }, { status: 400 })
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `Fichier trop volumineux: ${file.name}. Taille maximale: 10MB` }, { status: 400 })
      }
    }

    const imagesUrls: string[] = []

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())

      const detectedType = detectMimeType(buffer)
      if (!detectedType || !ALLOWED_TYPES.includes(detectedType)) {
        return NextResponse.json({ error: `Contenu de fichier invalide: ${file.name}` }, { status: 400 })
      }

      const ext = MIME_TO_EXT[detectedType] ?? 'jpg'
      const key = generateAccommodationKey(ext)
      const url = await uploadFile({ key, body: buffer, contentType: detectedType })
      imagesUrls.push(url)
    }

    return NextResponse.json({ images_urls: imagesUrls })
  } catch (error) {
    Sentry.captureException(error, { tags: { route: 'upload' } })
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 })
  }
}
