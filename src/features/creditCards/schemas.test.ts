import { describe, expect, it } from 'vitest'
import { creditCardSchema } from './schemas'

const validCard = {
  card_name: 'HDFC Regalia',
  bank: 'HDFC Bank',
  network: 'Visa',
  credit_limit: 200000,
  statement_day: 3,
  due_day: 23,
  opening_balance: 0,
  notes: '',
}

describe('creditCardSchema', () => {
  it('accepts a fully valid card', () => {
    expect(creditCardSchema.safeParse(validCard).success).toBe(true)
  })

  it('rejects a missing card_name', () => {
    const result = creditCardSchema.safeParse({ ...validCard, card_name: '' })
    expect(result.success).toBe(false)
  })

  it('rejects statement_day out of range', () => {
    expect(creditCardSchema.safeParse({ ...validCard, statement_day: 32 }).success).toBe(false)
    expect(creditCardSchema.safeParse({ ...validCard, statement_day: 0 }).success).toBe(false)
  })

  it('rejects due_day out of range', () => {
    expect(creditCardSchema.safeParse({ ...validCard, due_day: 32 }).success).toBe(false)
  })

  it('rejects a negative credit limit', () => {
    expect(creditCardSchema.safeParse({ ...validCard, credit_limit: -1 }).success).toBe(false)
  })

  it('rejects a negative opening balance', () => {
    expect(creditCardSchema.safeParse({ ...validCard, opening_balance: -1 }).success).toBe(false)
  })

  it('allows optional bank/network/notes to be omitted', () => {
    const { bank, network, notes, ...required } = validCard
    void bank
    void network
    void notes
    expect(creditCardSchema.safeParse(required).success).toBe(true)
  })
})
