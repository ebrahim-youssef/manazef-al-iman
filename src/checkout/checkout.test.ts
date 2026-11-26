import { describe, expect, it, vi } from 'vitest'
import { createOrderCore } from './createOrderCore'
import { buildOrderMessage, normalizeEgyptianMobile, isEgyptianMobile } from './whatsappOrder'

const product = {
  id: 'cos-1',
  name: 'شامبو',
  unit: 'العبوة',
  available: true,
  price: 100,
  saleType: 'price' as const,
  saleValue: 80,
  saleStartsAt: null,
  saleEndsAt: null,
  fridayType: 'none' as const,
  fridayValue: null,
}

describe('createOrderCore', () => {
  it('reprices from current product data and ignores client prices', async () => {
    const saveOrder = vi.fn(async () => 'ABC234')
    const result = await createOrderCore(
      [{ id: 'cos-1', quantity: 2, price: 1 }],
      async () => [product],
      saveOrder,
      new Date('2026-11-26T12:00:00.000Z'),
    )

    expect(saveOrder).toHaveBeenCalledWith([{ id: 'cos-1', name: 'شامبو', unit: 'العبوة', unitPrice: 80, quantity: 2 }])
    expect(result.total).toBe(160)
  })

  it('drops unavailable and missing products', async () => {
    const saveOrder = vi.fn(async () => 'ABC234')
    const result = await createOrderCore(
      [{ id: 'cos-1', quantity: 2 }, { id: 'missing', quantity: 1 }, { id: 'off', quantity: 1 }],
      async () => [product, { ...product, id: 'off', available: false }],
      saveOrder,
      new Date('2026-11-26T12:00:00.000Z'),
    )

    expect(result.items.map((item) => item.id)).toEqual(['cos-1'])
    expect(saveOrder).toHaveBeenCalledTimes(1)
  })

  it('rejects an empty cart and a cart with no available products', async () => {
    const saveOrder = vi.fn(async () => 'ABC234')
    await expect(createOrderCore([], async () => [], saveOrder)).rejects.toThrow('empty')
    await expect(createOrderCore([{ id: 'off', quantity: 1 }], async () => [], saveOrder)).rejects.toThrow('available')
    expect(saveOrder).not.toHaveBeenCalled()
  })

  it('rejects malformed ids and quantities before loading products', async () => {
    const getProducts = vi.fn(async () => [product])
    const saveOrder = vi.fn(async () => 'ABC234')
    await expect(createOrderCore([{ id: '', quantity: 1 }], getProducts, saveOrder)).rejects.toThrow('id')
    await expect(createOrderCore([{ id: 'cos-1', quantity: 1.5 }], getProducts, saveOrder)).rejects.toThrow('integer')
    expect(getProducts).not.toHaveBeenCalled()
    expect(saveOrder).not.toHaveBeenCalled()
  })
})

describe('WhatsApp order details', () => {
  it('matches the order template and omits blank notes', () => {
    expect(buildOrderMessage({
      code: 'ABC234',
      customer: { name: 'سارة', phone: '01012345678', area: 'المعادي', address: 'شارع النصر', notes: '  ' },
      items: [{ name: 'شامبو', quantity: 2, lineTotal: 160 }],
      total: 160,
    })).toBe('طلب جديد #ABC234\nالاسم: سارة\nالموبايل: 01012345678\nالمنطقة: المعادي\nالعنوان: شارع النصر\n\n- شامبو × 2 = ١٦٠ ج\nالإجمالي بدون التوصيل: ١٦٠ ج')
  })

  it('omits missing notes and includes trimmed non-empty notes', () => {
    const message = buildOrderMessage({
      code: 'ABC234',
      customer: { name: 'سارة', phone: '01012345678', area: 'المعادي', address: 'شارع النصر' },
      items: [{ name: 'شامبو', quantity: 1, lineTotal: 80 }],
      total: 80,
    })
    expect(message).not.toContain('ملاحظات:')
    expect(buildOrderMessage({
      code: 'ABC234',
      customer: { name: 'سارة', phone: '01012345678', area: 'المعادي', address: 'شارع النصر', notes: '  اتصل عند الوصول  ' },
      items: [{ name: 'شامبو', quantity: 1, lineTotal: 80 }],
      total: 80,
    })).toContain('ملاحظات: اتصل عند الوصول')
  })

  it('normalizes Arabic-Indic digits and validates Egyptian mobile numbers', () => {
    expect(normalizeEgyptianMobile('٠١٠١٢٣٤٥٦٧٨')).toBe('01012345678')
    expect(isEgyptianMobile('٠١٠١٢٣٤٥٦٧٨')).toBe(true)
    expect(isEgyptianMobile('0111234567')).toBe(false)
    expect(isEgyptianMobile('01912345678')).toBe(false)
  })
})
