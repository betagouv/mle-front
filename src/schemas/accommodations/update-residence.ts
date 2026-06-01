import { z } from 'zod'
import { EResidenceType } from '~/enums/residence-type'
import { ETargetAudience } from '~/enums/target-audience'
import { ZTypologies } from './typology'

export const ZUpdateResidence = z.object({
  name: z.string().min(1, 'Le nom de la résidence est requis').optional(),
  residenceType: z.enum(EResidenceType, { error: 'Le type de la résidence est requis' }).optional(),
  targetAudience: z.enum(ETargetAudience, { error: 'Le public cible est requis' }).optional(),
  addresses: z
    .array(
      z.object({
        address: z.string().min(1, "L'adresse est requise"),
        city: z.string().min(1, 'La ville est requise'),
        postalCode: z.string().min(1, 'Le code postal est requis'),
      }),
    )
    .min(1, 'Au moins une adresse est requise')
    .optional(),
  description: z.string().optional(),
  rentalChargesDetails: z.string().optional(),
  externalUrl: z.url('Veuillez saisir une URL valide').optional().or(z.literal('')),
  virtualTourUrl: z.string().optional(),

  acceptWaitingList: z.boolean().optional(),

  // Typologies as a structured array (validations live in ZTypology / ZTypologies).
  typologies: ZTypologies.optional(),

  nbAccessibleApartments: z.number().nullish(),
  nbColivingApartments: z.number().nullish(),

  refrigerator: z.boolean().optional(),
  laundryRoom: z.boolean().optional(),
  bathroom: z.enum(['private', 'shared']).optional(),
  kitchenType: z.enum(['private', 'shared']).optional(),
  microwave: z.boolean().optional(),
  secureAccess: z.boolean().optional(),
  parking: z.boolean().optional(),
  commonAreas: z.boolean().optional(),
  bikeStorage: z.boolean().optional(),
  desk: z.boolean().optional(),
  residenceManager: z.boolean().optional(),
  cookingPlates: z.boolean().optional(),
  wifi: z.boolean().optional(),
  imagesUrls: z.array(z.string().transform((url) => encodeURI(url))).optional(),

  published: z.boolean().optional(),
  scholarshipHoldersPriority: z.boolean().optional(),
  socialHousingRequired: z.boolean().optional(),
})

export type TUpdateResidence = z.infer<typeof ZUpdateResidence>
