import { supabase } from '../../lib/supabaseClient'
import type { CreditCardFormValues } from './schemas'

export interface CreditCard extends CreditCardFormValues {
  id: string
  created_by: string | null
}

export async function listCreditCards(): Promise<CreditCard[]> {
  const { data, error } = await supabase.from('credit_cards').select('*').order('card_name')
  if (error) throw error
  return data as CreditCard[]
}

export async function createCreditCard(values: CreditCardFormValues, createdBy: string) {
  const { error } = await supabase.from('credit_cards').insert({ ...values, created_by: createdBy })
  if (error) throw error
}

export async function updateCreditCard(id: string, values: CreditCardFormValues) {
  const { error } = await supabase.from('credit_cards').update(values).eq('id', id)
  if (error) throw error
}

export async function deleteCreditCard(id: string) {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id)
  if (error) throw error
}
