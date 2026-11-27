import { describe, expect, it, vi } from 'vitest'
import { filterProducts, formatCairoDateTime, parseCairoDateTime, productImagePaths, validateProduct, writeProductWithImages, type ProductDraft } from './adminProducts'

const product: ProductDraft = {
  id: 'soap-1', category_id: 'cosmetics', name: 'صابون دوف', brand_id: 'dove', description: '',
  image_path: '', price_egp: 50, is_available: true, is_featured: false, sale_type: 'none', sale_value: null,
  sale_starts_at: null, sale_ends_at: null, friday_type: 'none', friday_value: null,
}

describe('product administration', () => {
  it('requires whole-pound prices and validates sale and Friday deal rules', () => {
    expect(validateProduct({ ...product, price_egp: 50.5 })).toContain('السعر')
    expect(validateProduct({ ...product, price_egp: Number.NaN })).toContain('السعر')
    expect(validateProduct({ ...product, price_egp: 0 })).toContain('١')
    expect(validateProduct({ ...product, price_egp: 1 })).toBe('')
    expect(validateProduct({ ...product, sale_type: 'price', sale_value: 0 })).toContain('١')
    expect(validateProduct({ ...product, friday_type: 'price', friday_value: 0 })).toContain('١')
    expect(validateProduct({ ...product, sale_type: 'price', sale_value: 1 })).toBe('')
    expect(validateProduct({ ...product, sale_type: 'price', sale_value: -1 })).toContain('السعر')
    expect(validateProduct({ ...product, sale_type: 'price', sale_value: 50 })).toContain('السعر')
    expect(validateProduct({ ...product, sale_type: 'percent', sale_value: 0 })).toContain('نسبة')
    expect(validateProduct({ ...product, friday_type: 'percent', friday_value: 91 })).toContain('الجمعة')
    expect(validateProduct({ ...product, sale_starts_at: '2026-12-02T00:00', sale_ends_at: '2026-12-01T00:00' })).toContain('تاريخ')
    expect(validateProduct({ ...product, price_egp: 50 })).toBe('')
  })

  it('derives the detail image path from the stored card path', () => {
    expect(productImagePaths('soap-1')).toEqual({
      cardPath: 'products/soap-1.webp',
      detailPath: 'products/soap-1-detail.webp',
    })
  })

  it('shows and parses sale dates in Cairo time while storing UTC', () => {
    expect(formatCairoDateTime('2026-12-01T10:00:00.000Z')).toBe('2026-12-01T12:00')
    expect(parseCairoDateTime('2026-12-01T12:00')).toBe('2026-12-01T10:00:00.000Z')
    expect(() => parseCairoDateTime('2026-10-29T23:30')).toThrow('يتكرر')
  })

  it('filters by name, category, availability, and featured state', () => {
    const products = [
      product,
      { ...product, id: 'clean-1', category_id: 'cleaners', name: 'سائل تنظيف', is_available: false, is_featured: true },
      { ...product, id: 'soap-2', name: 'صابون سائل', is_featured: true },
    ]
    expect(filterProducts(products, { search: 'صابون', categoryId: 'all', availableOnly: false, featuredOnly: false }).map(({ id }) => id)).toEqual(['soap-1', 'soap-2'])
    expect(filterProducts(products, { search: '', categoryId: 'cleaners', availableOnly: false, featuredOnly: false }).map(({ id }) => id)).toEqual(['clean-1'])
    expect(filterProducts(products, { search: '', categoryId: 'all', availableOnly: true, featuredOnly: true }).map(({ id }) => id)).toEqual(['soap-2'])
  })

  it('removes newly uploaded files when saving fails, and old files only after a successful write', async () => {
    const events: string[] = []
    const upload = vi.fn(async () => { events.push('upload'); return ['products/soap-1.webp', 'products/soap-1-detail.webp'] })
    const write = vi.fn(async (): Promise<{ error: { message: string } | null }> => { events.push('write'); return { error: new Error('write failed') } })
    const removeNew = vi.fn(async (paths: string[]) => { events.push(`remove-new:${paths.length}`) })
    const removeOld = vi.fn(async () => { events.push('remove-old') })

    await expect(writeProductWithImages({ upload, write, removeNew, removeOld })).rejects.toThrow('write failed')
    expect(events).toEqual(['upload', 'write', 'remove-new:2'])

    events.length = 0
    write.mockImplementationOnce(async () => { events.push('write'); throw new Error('network failed') })
    await expect(writeProductWithImages({ upload, write, removeNew, removeOld })).rejects.toThrow('network failed')
    expect(events).toEqual(['upload', 'write', 'remove-new:2'])

    events.length = 0
    write.mockImplementationOnce(async () => { events.push('write'); return { error: null } })
    await writeProductWithImages({ upload, write, removeNew, removeOld })
    expect(events).toEqual(['upload', 'write', 'remove-old'])
  })
})
