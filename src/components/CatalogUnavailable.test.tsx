import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { CatalogUnavailable } from './CatalogUnavailable'

describe('catalog outage state', () => {
  it('shows a friendly Arabic message and default WhatsApp contact', () => {
    render(<CatalogUnavailable />)
    expect(screen.getByText('يمكننا مساعدتك في طلب منتجاتك')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'تواصل معنا على واتساب' })).toHaveAttribute('href', 'https://wa.me/2010XXXXXXXXX')
  })
})
