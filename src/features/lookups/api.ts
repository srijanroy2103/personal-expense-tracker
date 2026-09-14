import { supabase } from '../../lib/supabaseClient'
import type { LookupRow, LookupTable } from './types'

const orderColumn = (table: LookupTable) =>
  table === 'categories' || table === 'subcategories' ? 'sort_order' : 'name'

export async function listLookupRows(table: LookupTable): Promise<LookupRow[]> {
  const { data, error } = await supabase.from(table).select('*').order(orderColumn(table))
  if (error) throw error
  return data as LookupRow[]
}

export async function createLookupRow(table: LookupTable, values: Partial<LookupRow>) {
  const { error } = await supabase.from(table).insert(values)
  if (error) throw error
}

export async function updateLookupRow(table: LookupTable, id: string, values: Partial<LookupRow>) {
  const { error } = await supabase.from(table).update(values).eq('id', id)
  if (error) throw error
}

export async function deleteLookupRow(table: LookupTable, id: string) {
  const { error } = await supabase.from(table).delete().eq('id', id)
  if (error) throw error
}

export function friendlyLookupError(err: unknown): string {
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === '23505') {
    return 'That name already exists.'
  }
  return err instanceof Error ? err.message : 'Something went wrong'
}
