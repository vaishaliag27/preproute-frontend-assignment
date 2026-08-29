import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { testsApi, taxonomyApi } from '../api'

export function useTests() {
  return useQuery({
    queryKey: ['tests'],
    queryFn: ({ signal }) => testsApi.list(signal),
  })
}

export function useSubjects() {
  return useQuery({
    queryKey: ['subjects'],
    queryFn: ({ signal }) => taxonomyApi.subjects(signal),
  })
}

export function useDeleteTest() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => testsApi.remove(id),
    onMutate: (id) => {
      // Optimistic update - remove test immediately
      queryClient.setQueryData(['tests'], (old: any) =>
        old ? old.filter((t: any) => t.id !== id) : []
      )
    },
    onSuccess: () => {
      // Refetch fresh data after successful delete
      void queryClient.invalidateQueries({ queryKey: ['tests'] })
    },
  })
}
