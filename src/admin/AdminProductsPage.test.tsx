import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AdminClientContext } from './AdminClientContext'
import AdminProductsPage from './AdminProductsPage'
import { TestProviders } from '../test-utils'

afterEach(cleanup)

const product = { id: 'p1', name: 'مسحوق أريال', brand_id: 'ariel', category_id: 'washing', description: 'للغسيل', image_path: '', price_egp: 50, is_available: true, is_featured: false, sale_type: 'none', sale_value: null, sale_starts_at: null, sale_ends_at: null, friday_type: 'none', friday_value: null }

function catalogClient() {
  const rows: Record<string, unknown[]> = { products: [product], categories: [{ id: 'other', name: 'أخرى', image_path: '', sort_order: 0 }, { id: 'washing', name: 'غسيل', image_path: '', sort_order: 1 }], brands: [{ id: 'ariel', name: 'Ariel', arabic_name: 'أريال' }] }
  return { storage: { from: () => ({ getPublicUrl: () => ({ data: { publicUrl: '' } }) }) }, from: vi.fn((table: string) => ({ select: () => ({ order: () => Object.assign(Promise.resolve({ data: rows[table], error: null }), { order: () => Promise.resolve({ data: rows[table], error: null }) }) }) })) }
}

it('opens the matching product when an admin search contains a spelling mistake', async () => {
  render(<TestProviders><AdminClientContext.Provider value={catalogClient() as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  const search = await screen.findByPlaceholderText('ابحث باسم المنتج')
  fireEvent.change(search, { target: { value: 'اريالل' } })
  fireEvent.click(await screen.findByRole('option', { name: /مسحوق أريال/ }))
  expect(screen.getByRole('dialog', { name: 'تعديل المنتج' })).toBeInTheDocument()
  expect(screen.getByLabelText('اسم المنتج')).toHaveValue('مسحوق أريال')
})

it('renames a brand and shows the new name on its product', async () => {
  const client = catalogClient()
  const originalFrom = client.from
  client.from = vi.fn((table: string) => table === 'brands' ? {
    ...originalFrom(table),
    update: (value: { name: string }) => ({ eq: async () => { originalFrom.mockClear(); brand.name = value.name; return { error: null } } }),
  } : originalFrom(table)) as never
  const brand = { id: 'ariel', name: 'Ariel', arabic_name: 'أريال' }
  // Supply mutable rows to the reload after the rename.
  const baseFrom = client.from
  client.from = vi.fn((table: string) => table === 'brands' ? { ...baseFrom(table), select: () => ({ order: async () => ({ data: [brand], error: null }) }) } : baseFrom(table)) as never
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByText('العلامات التجارية'))
  fireEvent.click(await screen.findByRole('button', { name: 'تعديل Ariel' }))
  fireEvent.change(screen.getByLabelText('اسم العلامة التجارية'), { target: { value: 'Ariel جديد' } })
  fireEvent.click(screen.getByRole('button', { name: 'حفظ العلامة' }))
  expect(await screen.findByRole('button', { name: /مسحوق أريال.*Ariel جديد/ })).toBeInTheDocument()
})

it('shows the number of products when deleting a used brand is refused', async () => {
  const client = catalogClient()
  const originalFrom = client.from
  client.from = vi.fn((table: string) => table === 'brands' ? { ...originalFrom(table), delete: () => ({ eq: async () => ({ error: { code: '23503' } }) }) } : table === 'products' ? { ...originalFrom(table), select: (_columns: string, options?: { head?: boolean }) => options?.head ? { eq: async () => ({ count: 1, error: null }) } : originalFrom(table).select() } : originalFrom(table)) as never
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByText('العلامات التجارية'))
  fireEvent.click(await screen.findByRole('button', { name: 'حذف Ariel' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('1 منتج')
})

it('copies only category, brand and description from a suggested product', async () => {
  const client = catalogClient()
  render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminProductsPage /></AdminClientContext.Provider></TestProviders>)
  fireEvent.click(await screen.findByRole('button', { name: 'إضافة' }))
  fireEvent.change(screen.getByLabelText('اسم المنتج'), { target: { value: 'اريالل' } })
  fireEvent.click(await screen.findByRole('option', { name: /مسحوق أريال/ }))
  expect(screen.getByLabelText('القسم')).toHaveValue('washing')
  expect(screen.getByLabelText('العلامة التجارية')).toHaveValue('Ariel')
  expect(screen.getByLabelText('الوصف')).toHaveValue('للغسيل')
  expect(screen.getByLabelText('السعر بالجنيه')).toHaveValue(null)
  expect(screen.queryByAltText('معاينة صورة المنتج')).not.toBeInTheDocument()
})

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
