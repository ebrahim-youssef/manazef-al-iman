import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CatalogUnavailable } from './CatalogUnavailable'

vi.mock('@tanstack/react-router', () => ({
  useLoaderData: () => ({ whatsapp_number: '201012345678' }),
}))

describe('catalog outage state', () => {
  it('shows a friendly Arabic message and the current WhatsApp contact', () => {
    render(<CatalogUnavailable />)
    expect(screen.getByText('يمكننا مساعدتك في طلب منتجاتك')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'تواصل معنا على واتساب' })).toHaveAttribute('href', 'https://wa.me/201012345678')
  })
})
