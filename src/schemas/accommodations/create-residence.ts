import { z } from 'zod'
import { ZTypologies } from './typology'
import { ZUpdateResidence } from './update-residence'

export const ZCreateResidence = ZUpdateResidence.omit({ typologies: true }).extend({
  addresses: z
    .array(
      z.object({
        address: z.string().min(1, "L'adresse est requise"),
        city: z.string().min(1, 'La ville est requise'),
        postalCode: z.string().min(1, 'Le code postal est requis'),
      }),
    )
    .min(1, 'Au moins une adresse est requise'),
  externalUrl: z.url('Veuillez saisir une URL valide').min(1, "L'URL de redirection est requise"),
  imagesFiles: z.array(z.instanceof(File)).optional(),
  typologies: ZTypologies,
})

export type TCreateResidence = z.infer<typeof ZCreateResidence>

// Re-export the typology primitives from their shared module for existing import sites.
export { getTypologyLabel, type TTypology, TYPOLOGIES, TYPOLOGY_TYPES, type TypologyType, ZTypologies, ZTypology } from './typology'
