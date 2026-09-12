import { describe, expect, it } from 'vitest'
import { loginSchema } from './schemas'

describe('loginSchema', () => {
  it('accepts a valid email and password', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: 'secret1' })
    expect(result.success).toBe(true)
  })

  it('rejects an empty email', () => {
    const result = loginSchema.safeParse({ email: '', password: 'secret1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe('Email is required')
    }
  })

  it('rejects a malformed email', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'secret1' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.email?.[0]).toBe('Enter a valid email')
    }
  })

  it('rejects a password shorter than 6 characters', () => {
    const result = loginSchema.safeParse({ email: 'a@b.com', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.password?.[0]).toBe(
        'Password must be at least 6 characters',
      )
    }
  })
})
