import { TDepartments } from '~/schemas/departments'

export const getDepartments = async () => {
  const response = await fetch(`${process.env.API_URL}/territories/departments`)

  if (!response.ok) {
    throw new Error('Error occurred calling API while retrieving departments')
  }
  const data = await response.json()

  return data as TDepartments
}
