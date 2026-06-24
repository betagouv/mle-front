import { describe, expect, it } from 'vitest'
import { detectMimeType } from './detect-mime-type'

const JPEG_MAGIC = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01])
const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
const WEBP_MAGIC = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50])

describe('detectMimeType', () => {
  it('détecte un JPEG', () => {
    expect(detectMimeType(JPEG_MAGIC)).toBe('image/jpeg')
  })

  it('détecte un PNG', () => {
    expect(detectMimeType(PNG_MAGIC)).toBe('image/png')
  })

  it('détecte un WebP', () => {
    expect(detectMimeType(WEBP_MAGIC)).toBe('image/webp')
  })

  it('retourne null pour un contenu non reconnu (ex. HTML)', () => {
    const html = Buffer.from('<html><body>hack</body></html>')
    expect(detectMimeType(html)).toBeNull()
  })

  it('retourne null si le buffer est trop court', () => {
    expect(detectMimeType(Buffer.from([0xff, 0xd8]))).toBeNull()
  })
})
