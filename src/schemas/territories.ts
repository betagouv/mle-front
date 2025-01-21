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
    epci_code: z.string(),
    id: z.number(),
    insee_code: z.string(),
    name: z.string(),
    nb_students: z.number(),
    popular: z.boolean(),
    postal_codes: z.array(z.string()),
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
