import { useQuery } from '@tanstack/react-query'
import { useQueryState } from 'nuqs'
import { useState } from 'react'
import { useDebounce } from 'use-debounce'
import { TTerritories } from '~/schemas/territories'

export const fetchTerritories = async (query: string): Promise<TTerritories> => {
  const response = await fetch(`/api/territories?q=${query}`)
  if (!response.ok) {
    throw new Error('Error occurred calling API retrieving territories')
  }
  return response.json()
}

export const useTerritories = (debounceTime = 200) => {
  const [searchQueryState] = useQueryState('q')

  const [searchQuery, setSearchQuery] = useState(searchQueryState || '')
  const [debouncedSearchQuery] = useDebounce(searchQuery, debounceTime)

  const { data, isError, isLoading } = useQuery<TTerritories>({
    enabled: !!debouncedSearchQuery && debouncedSearchQuery.length >= 2,
    queryFn: () => fetchTerritories(debouncedSearchQuery),
    queryKey: ['territories', debouncedSearchQuery],
  })
  return {
    data,
    isError,
    isLoading,
    searchQuery,
    setSearchQuery,
  }
}
