import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminClientContext } from './AdminClientContext'
import AdminProductsPage from './AdminProductsPage'

afterEach(cleanup)

it('opens a product form without a sale unit field', async () => {
  const client = {
    from: vi.fn(() => ({
      select: () => ({ order: () => Object.assign(Promise.resolve({ data: [], error: null }), {
        order: () => Promise.resolve({ data: [], error: null }),
      }) }),
    })),
  }
  render(<AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider>)
  fireEvent.click(await screen.findByRole('button', { name: 'إضافة' }))
  expect(screen.getByLabelText('اسم المنتج')).toBeInTheDocument()
  expect(screen.queryByLabelText('وحدة البيع')).not.toBeInTheDocument()
})
