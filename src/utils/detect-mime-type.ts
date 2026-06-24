const SIGNATURES: Array<{ mime: string; match: (b: Buffer) => boolean }> = [
  {
    mime: 'image/jpeg',
    match: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: 'image/png',
    match: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    // WebP : RIFF????WEBP
    mime: 'image/webp',
    match: (b) =>
      b[0] === 0x52 &&
      b[1] === 0x49 &&
      b[2] === 0x46 &&
      b[3] === 0x46 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50,
  },
]

const MIN_BYTES = 12

/**
 * Détecte le type MIME réel d'un buffer via ses magic bytes.
 * Retourne null si le buffer est trop court ou le format non reconnu.
 */
export function detectMimeType(buffer: Buffer): string | null {
  if (buffer.length < MIN_BYTES) return null
  return SIGNATURES.find((s) => s.match(buffer))?.mime ?? null
}
