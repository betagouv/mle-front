import { z } from 'zod'

const ZDepartment = z.object({
  bbox: z.string(),
  id: z.number(),
  name: z.string(),
})
export type TDepartment = z.infer<typeof ZDepartment>

export const ZDepartments = z.array(ZDepartment)

export type TDepartments = z.infer<typeof ZDepartments>
