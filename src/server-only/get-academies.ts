import { TAcademyOrDepartment } from '~/schemas/territories'

export const getAcademies = async () => {
  const response = await fetch(`${process.env.API_URL}/territories`)

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving academies')
  }
  const data = await response.json()

  return data.academies.sort((a1: TAcademyOrDepartment, a2: TAcademyOrDepartment) => a1.name.localeCompare(a2.name))
}
