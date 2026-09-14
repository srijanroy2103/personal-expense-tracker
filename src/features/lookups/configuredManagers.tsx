import { LookupManager } from './LookupManager'
import { categorySchema, simpleNameSchema, subcategorySchema } from './schemas'

export const CategoriesManager = () => (
  <LookupManager
    table="categories"
    title="Categories"
    schema={categorySchema}
    fields={[
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'type', label: 'Type', kind: 'select', options: ['Income', 'Expense'] },
      { name: 'sort_order', label: 'Sort order', kind: 'number' },
    ]}
  />
)

export const SubcategoriesManager = () => (
  <LookupManager
    table="subcategories"
    title="Sub-categories"
    schema={subcategorySchema}
    fields={[
      { name: 'name', label: 'Name', kind: 'text' },
      { name: 'sort_order', label: 'Sort order', kind: 'number' },
    ]}
  />
)

export const PaymentMethodsManager = () => (
  <LookupManager
    table="payment_methods"
    title="Payment methods"
    schema={simpleNameSchema}
    fields={[{ name: 'name', label: 'Name', kind: 'text' }]}
  />
)

export const AccountsManager = () => (
  <LookupManager
    table="accounts"
    title="Accounts"
    schema={simpleNameSchema}
    fields={[{ name: 'name', label: 'Name', kind: 'text' }]}
  />
)

export const TagsManager = () => (
  <LookupManager
    table="tags"
    title="Tags"
    schema={simpleNameSchema}
    fields={[{ name: 'name', label: 'Name', kind: 'text' }]}
  />
)
