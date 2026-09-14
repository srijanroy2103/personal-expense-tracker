export type LookupTable = 'categories' | 'subcategories' | 'payment_methods' | 'accounts' | 'tags'

export interface LookupRow {
  id: string
  name: string
  type?: 'Income' | 'Expense'
  sort_order?: number | null
}
