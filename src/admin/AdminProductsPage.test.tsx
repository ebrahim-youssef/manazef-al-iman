import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminClientContext } from './AdminClientContext'
import AdminProductsPage from './AdminProductsPage'
import { TestProviders } from '../test-utils'

afterEach(cleanup)

it('opens a product form without a sale unit field', async () => {
  const client = {
    from: vi.fn(() => ({
      select: () => ({ order: () => Object.assign(Promise.resolve({ data: [], error: null }), {
        order: () => Promise.resolve({ data: [], error: null }),
      }) }),
    })),
  }
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByRole('button', { name: 'إضافة' }))
  expect(screen.getByLabelText('اسم المنتج')).toBeInTheDocument()
  expect(screen.queryByLabelText('وحدة البيع')).not.toBeInTheDocument()
})

it('selects a brand from the product form', async () => {
  const client = {
    from: vi.fn((table: string) => ({
      select: () => ({ order: () => Object.assign(Promise.resolve({ data: table === 'brands' ? [{ id: 'pril', name: 'Pril', arabic_name: 'بريل' }] : [], error: null }), {
        order: () => Promise.resolve({ data: [], error: null }),
      }) }),
    })),
  }
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByRole('button', { name: 'إضافة' }))
  fireEvent.change(screen.getByLabelText('العلامة التجارية'), { target: { value: 'بريل' } })
  fireEvent.click(await screen.findByText('Pril'))
  expect(screen.getByLabelText('العلامة التجارية')).toHaveValue('Pril')
})

it.each(['created', 'duplicate'])('selects the %s brand after adding it', async (outcome) => {
  const brand = { id: 'new-brand', name: 'أمل', arabic_name: null }
  const insert = vi.fn(() => ({ select: () => ({ single: async () => outcome === 'created'
    ? { data: brand, error: null }
    : { data: null, error: { code: '23505' } } }) }))
  const client = {
    from: vi.fn(() => ({
      select: () => ({
        order: () => Object.assign(Promise.resolve({ data: [], error: null }), { order: () => Promise.resolve({ data: [], error: null }) }),
        eq: () => ({ maybeSingle: async () => ({ data: brand, error: null }) }),
      }),
      insert,
    })),
  }
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByRole('button', { name: 'إضافة' }))
  fireEvent.change(screen.getByLabelText('العلامة التجارية'), { target: { value: 'امل' } })
  fireEvent.click(await screen.findByText('إضافة «امل»'))
  expect(await screen.findByDisplayValue('أمل')).toBeInTheDocument()
  expect(insert).toHaveBeenCalledOnce()
})
