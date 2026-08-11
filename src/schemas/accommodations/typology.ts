import { z } from 'zod'

// Typologies — le `type` EST le suffixe (t1, t1_bis, …), aligné sur l'enum DB
// `accommodation_typology_type`, sur les clés de l'objet `typologies` exposé en réponse,
// et sur l'`apartmentType` de DossierFacile. Aucun mapping type↔suffixe nécessaire.
export const TYPOLOGIES = [
  { type: 't1', label: 'Studio T1' },
  { type: 't1_bis', label: 'Studio T1 bis' },
  { type: 't2', label: 'Logement T2' },
  { type: 't3', label: 'Logement T3' },
  { type: 't4', label: 'Logement T4' },
  { type: 't5', label: 'Logement T5' },
  { type: 't6', label: 'Logement T6' },
  { type: 't7_more', label: 'Logement T7+' },
] as const

export type TypologyType = (typeof TYPOLOGIES)[number]['type']

export const TYPOLOGY_TYPES = TYPOLOGIES.map((t) => t.type) as unknown as readonly [TypologyType, ...TypologyType[]]

export const getTypologyLabel = (type: string): string => TYPOLOGIES.find((t) => t.type === type)?.label ?? type

// Les colonnes numériques de `accommodation_typology` sont toutes nullables : une typologie
// peut être incomplète (import CSV partiel, saisie en plusieurs fois). Les bornes ne
// s'appliquent donc qu'aux valeurs effectivement renseignées, jamais à null/undefined.
export const ZTypology = z
  .object({
    type: z.enum(TYPOLOGY_TYPES, { error: 'Veuillez sélectionner un type de logement' }),
    priceMin: z.number({ error: 'Le loyer minimum doit être un nombre' }).min(0, 'Le loyer minimum doit être positif').nullish(),
    priceMax: z.number({ error: 'Le loyer maximum doit être un nombre' }).min(0, 'Le loyer maximum doit être positif').nullish(),
    superficieMin: z
      .number({ error: 'La superficie minimum doit être un nombre' })
      .min(1, 'La superficie minimum doit être au moins 1 m²')
      .nullish(),
    superficieMax: z
      .number({ error: 'La superficie maximum doit être un nombre' })
      .min(1, 'La superficie maximum doit être au moins 1 m²')
      .nullish(),
    colocation: z.boolean(),
    nbTotal: z.number({ error: 'Le nombre total doit être un nombre' }).min(1, 'Le nombre total doit être au moins 1').nullish(),
    nbAvailable: z.number({ error: 'Le nombre disponible doit être un nombre' }).min(0, 'Le nombre disponible doit être positif').nullish(),
  })
  .superRefine((data, ctx) => {
    if (data.priceMin != null && data.priceMax != null && data.priceMin > data.priceMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Le loyer minimum ne peut pas être supérieur au loyer maximum',
        path: ['priceMin'],
      })
    }
    if (data.superficieMin != null && data.superficieMax != null && data.superficieMin > data.superficieMax) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'La superficie minimum ne peut pas être supérieure à la superficie maximum',
        path: ['superficieMin'],
      })
    }
    if (data.nbAvailable != null && data.nbTotal != null && data.nbAvailable > data.nbTotal) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le nombre de logements disponibles ne peut pas être supérieur au nombre total (${data.nbTotal})`,
        path: ['nbAvailable'],
      })
    }
  })

export type TTypology = z.infer<typeof ZTypology>

/** Validate a typologies array: at least one, and no duplicate type. */
export const ZTypologies = z
  .array(ZTypology)
  .min(1, 'Au moins un type de logement est requis')
  .superRefine((typologies, ctx) => {
    const seen = new Set<string>()
    typologies.forEach((t, i) => {
      if (seen.has(t.type)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `Le type "${getTypologyLabel(t.type)}" est déjà utilisé`, path: [i, 'type'] })
      }
      seen.add(t.type)
    })
  })
