import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders the Hello FamFin smoke test heading', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /hello famfin/i })).toBeInTheDocument()
  })
})
