import { TDepartment, TDepartments } from '~/schemas/departments'

export const getDepartments = async () => {
  const response = await fetch(`${process.env.API_URL}/territories/departments`, { next: { revalidate: 60 * 60 * 24 } })

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving departments')
  }
  const data = await response.json()

  return data
    .filter((department: TDepartment) => !!department.name)
    .sort((a: TDepartment, b: TDepartment) => a.name.localeCompare(b.name)) as TDepartments
}
