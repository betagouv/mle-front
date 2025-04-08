import { z } from 'zod'

const ZBbox = z.object({
  bbox: z.object({
    xmax: z.number(),
    xmin: z.number(),
    ymax: z.number(),
    ymin: z.number(),
  }),
})

const ZAcademyOrDepartment = z
  .object({
    id: z.number(),
    name: z.string(),
  })
  .merge(ZBbox)

const ZCity = z
  .object({
    average_income: z.number(),
    average_rent: z.number(),
    epci_code: z.string(),
    id: z.number(),
    insee_codes: z.array(z.string()),
    name: z.string(),
    nb_total_apartments: z.number(),
    nb_students: z.number(),
    nearby_cities: z.array(
      z.object({
        name: z.string(),
        slug: z.string(),
      }),
    ),
    popular: z.boolean(),
    postal_codes: z.array(z.string()),
    slug: z.string(),
  })
  .merge(ZBbox)

export type TAcademyOrDepartment = z.infer<typeof ZAcademyOrDepartment>
export type TCity = z.infer<typeof ZCity>
export type TTerritory = TAcademyOrDepartment | TCity

export const ZTerritories = z.object({
  academies: z.array(ZAcademyOrDepartment),
  cities: z.array(ZCity),
  departments: z.array(ZAcademyOrDepartment),
})

export type TTerritories = z.infer<typeof ZTerritories>
