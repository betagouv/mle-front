import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { TCity } from '~/schemas/territories'

export const fetchCitiesByDepartmentCode = async (code: string): Promise<TCity[]> => {
  const response = await fetch(`/api/territories/cities?department=${code}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving territories')
  }
  return response.json() as Promise<TCity[]>
}

export const useCities = () => {
  const [departmentCode] = useQueryState('department')

  const { data, isError, isLoading } = useQuery<TCity[]>({
    enabled: !!departmentCode,
    queryFn: () => fetchCitiesByDepartmentCode(departmentCode as string),
    queryKey: ['cities-by-department', departmentCode],
  })
  return {
    data,
    isError,
    isLoading,
  }
}
