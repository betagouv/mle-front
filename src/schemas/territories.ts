import { z } from 'zod'

const ZAcademyOrDepartment = z.object({
  id: z.number(),
  name: z.string(),
})

const ZCity = z.object({
  id: z.number(),
  name: z.string(),
  postal_codes: z.array(z.string()),
})

export type TTerritory = z.infer<typeof ZCity> | z.infer<typeof ZAcademyOrDepartment>

export const ZTerritories = z.object({
  academies: z.array(ZAcademyOrDepartment),
  cities: z.array(ZCity),
  departments: z.array(ZAcademyOrDepartment),
})

export type TTerritories = z.infer<typeof ZTerritories>
