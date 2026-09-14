import { describe, expect, it } from 'vitest'
import { categorySchema, simpleNameSchema, subcategorySchema } from './schemas'

describe('simpleNameSchema', () => {
  it('accepts a non-empty name', () => {
    expect(simpleNameSchema.safeParse({ name: 'Cash' }).success).toBe(true)
  })

  it('rejects an empty name', () => {
    const result = simpleNameSchema.safeParse({ name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects a whitespace-only name', () => {
    const result = simpleNameSchema.safeParse({ name: '   ' })
    expect(result.success).toBe(false)
  })
})

describe('categorySchema', () => {
  it('accepts a valid Income category', () => {
    const result = categorySchema.safeParse({ name: 'Salary', type: 'Income', sort_order: 1 })
    expect(result.success).toBe(true)
  })

  it('accepts a valid Expense category without sort_order', () => {
    const result = categorySchema.safeParse({ name: 'Groceries', type: 'Expense' })
    expect(result.success).toBe(true)
  })

  it('rejects a missing type', () => {
    const result = categorySchema.safeParse({ name: 'Salary' })
    expect(result.success).toBe(false)
  })

  it('rejects an invalid type', () => {
    const result = categorySchema.safeParse({ name: 'Salary', type: 'Neither' })
    expect(result.success).toBe(false)
  })
})

describe('subcategorySchema', () => {
  it('accepts a valid subcategory', () => {
    expect(subcategorySchema.safeParse({ name: 'Fuel', sort_order: 13 }).success).toBe(true)
  })

  it('rejects an empty name', () => {
    expect(subcategorySchema.safeParse({ name: '' }).success).toBe(false)
  })
})
