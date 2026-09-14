import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createLookupRow, deleteLookupRow, listLookupRows, updateLookupRow } from './api'
import type { LookupRow, LookupTable } from './types'

export function useLookupTable(table: LookupTable) {
  const queryClient = useQueryClient()
  const queryKey = ['lookup', table]

  const rows = useQuery({ queryKey, queryFn: () => listLookupRows(table) })

  const invalidate = () => queryClient.invalidateQueries({ queryKey })

  const create = useMutation({
    mutationFn: (values: Partial<LookupRow>) => createLookupRow(table, values),
    onSuccess: invalidate,
  })

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<LookupRow> }) =>
      updateLookupRow(table, id, values),
    onSuccess: invalidate,
  })

  const remove = useMutation({
    mutationFn: (id: string) => deleteLookupRow(table, id),
    onSuccess: invalidate,
  })

  return { rows, create, update, remove }
}
