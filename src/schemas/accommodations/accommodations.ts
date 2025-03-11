import { z } from 'zod'

export enum EResidence {
  autre = 'Autre',
  ecole = "Résidence d'école",
  'foyer-soleil' = 'Foyer soleil',
  'hoteliere-sociale' = 'Résidence Hôtelière à vocation sociale',
  intergenerationnelle = 'Résidence intergénérationnelle',
  internat = 'Internat',
  'jeunes-travailleurs' = 'Résidence jeunes travailleurs',
  'mixte-actifs-etudiants' = 'Résidence mixte jeunes actifs/étudiants',
  'service-logement' = 'Service logement',
  'service-universitaire-privee' = 'Résidence service / Résidence universitaire privée',
  'sociale-jeunes-actifs' = 'Résidence sociale jeunes actifs',
  'u-crous' = 'Cité U / résidence traditionnelle CROUS',
  'universitaire-conventionnee' = 'Résidence Universitaire conventionnée',
}

export const ZGeometry = z.object({
  coordinates: z.array(z.number()),
  type: z.string(),
})

export const ZAccomodation = z.object({
  geometry: ZGeometry,
  id: z.number(),
  properties: z.object({
    address: z.string().max(255),
    city: z.string().max(150),
    images_base64: z.array(z.string()).nullable(),
    name: z.string().max(250),
    nb_accessible_apartments: z.number().nullable(),
    nb_coliving_apartments: z.number().nullable(),
    nb_t1: z.number().nullable(),
    nb_t1_bis: z.number().nullable(),
    nb_t2: z.number().nullable(),
    nb_t3: z.number().nullable(),
    nb_t4_more: z.number().nullable(),
    nb_total_apartments: z.number().nullable(),
    owner_name: z.string().max(150).nullable(),
    owner_url: z.string().max(500).nullable(),
    postal_code: z.string().max(5),
    price_min: z.number().nullable(),
    residence_type: z.nativeEnum(EResidence),
    slug: z.string().max(250),
  }),
})

export type TAccomodation = z.infer<typeof ZAccomodation>

export const ZAccomodationCard = ZAccomodation.pick({ id: true, properties: true })
export type TAccomodationCard = z.infer<typeof ZAccomodationCard>

export const ZAccomodationDetails = z.object({
  address: z.string().max(255),
  city: z.string().max(150),
  geom: ZGeometry,
  images_base64: z.array(z.string()).nullable(),
  name: z.string().max(250),
  nb_accessible_apartments: z.number().nullable(),
  nb_coliving_apartments: z.number().nullable(),
  nb_t1: z.number().nullable(),
  nb_t1_bis: z.number().nullable(),
  nb_t2: z.number().nullable(),
  nb_t3: z.number().nullable(),
  nb_t4_more: z.number().nullable(),
  nb_total_apartments: z.number().nullable(),
  owner_name: z.string().max(150).nullable(),
  owner_url: z.string().max(500).nullable(),
  postal_code: z.string().max(5),
  price_min: z.number().nullable(),
  residence_type: z.nativeEnum(EResidence),
  slug: z.string().max(250),
})
export type TAccomodationDetails = z.infer<typeof ZAccomodationDetails>
