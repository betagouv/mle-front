import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { TCity } from '~/schemas/territories'

export const fetchCities = async (query: string): Promise<TCity[]> => {
  const response = await fetch(`/api/territories?q=${query}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving territories')
  }
  const result = await response.json()
  return result.cities
}

export const useSearchCities = (debounceTime = 200) => {
  const [searchQueryState] = useQueryState('q')

  const [searchQuery, setSearchQuery] = useState(searchQueryState || '')
  const [debouncedSearchQuery] = useDebounce(searchQuery, debounceTime)

  const { data, isError, isLoading } = useQuery<TCity[]>({
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 2,
    queryFn: () => fetchCities(debouncedSearchQuery),
    queryKey: ['cities', debouncedSearchQuery],
  })
  return {
    data,
    isError,
    isLoading,
    searchQuery,
    setSearchQuery,
  }
}
