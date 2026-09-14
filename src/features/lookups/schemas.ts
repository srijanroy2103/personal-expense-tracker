import { z } from 'zod'

const name = z.string().trim().min(1, 'Name is required').max(100, 'Name is too long')
const sortOrder = z.coerce.number().int('Sort order must be a whole number').optional()

export const simpleNameSchema = z.object({ name })
export type SimpleNameFormValues = z.infer<typeof simpleNameSchema>

export const categorySchema = z.object({
  name,
  type: z.enum(['Income', 'Expense'], { message: 'Type is required' }),
  sort_order: sortOrder,
})
export type CategoryFormValues = z.infer<typeof categorySchema>

export const subcategorySchema = z.object({
  name,
  sort_order: sortOrder,
})
export type SubcategoryFormValues = z.infer<typeof subcategorySchema>
