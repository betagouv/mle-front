import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { TCity } from '~/schemas/territories'

export const fetchCitiesByDepartmentCode = async (code: string | null): Promise<TCity[]> => {
  const baseUrl = '/api/territories/cities'
  const searchParams = new URLSearchParams()
  if (!code) {
    searchParams.set('popular', 'true')
  } else {
    searchParams.set('department', code)
  }

  const response = await fetch(`${baseUrl}?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving territories')
  }
  return response.json() as Promise<TCity[]>
}

export const useCities = () => {
  const [departmentCode] = useQueryState('department')

  const { data, isError, isLoading } = useQuery<TCity[]>({
    queryFn: () => fetchCitiesByDepartmentCode(departmentCode),
    queryKey: ['cities-by-department', departmentCode],
  })
  return {
    data,
    isError,
    isLoading,
  }
}
