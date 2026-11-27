import { cleanup, render, screen, within } from '@testing-library/react'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getCatalog } from '../data/catalog'
import { getRouter } from '../router'

const { catalogFixture } = vi.hoisted(() => ({
  catalogFixture: {
    unavailable: false as const,
    categories: [
      { id: 'cleaners', slug: 'cleaners', name: 'منظفات', image: '', description: '' },
    ],
    products: [],
    settings: {
      shop_name: 'منظفات الإيمان',
      whatsapp_number: '201012345678',
      phone_number: '0100 000 0000',
      address: 'القاهرة، مصر',
      map_lat: null,
      map_lng: null,
      opening_hours_text: 'يوميًا 9 ص - 10 م',
      facebook_url: '',
      instagram_url: '',
      tiktok_url: '',
      delivery_areas: [],
    },
  },
}))

vi.mock('../data/catalog', () => ({
  getCatalog: vi.fn().mockResolvedValue(catalogFixture),
  getSearchIndex: vi.fn().mockResolvedValue(catalogFixture),
}))

vi.mock('../data/settings', async () => {
  const { mergeShopSettings } = await import('../config/shopDefaults')
  return { getShopSettings: vi.fn().mockResolvedValue(mergeShopSettings(null)), getNavigationCategories: vi.fn().mockResolvedValue(catalogFixture.categories) }
})

const product = (overrides: Record<string, unknown> = {}) => ({
  id: 'product-1',
  category: 'cleaners',
  name: 'منظف للاختبار',
  brand: 'الإيمان',
  unit: 'عبوة',
  description: '',
  price: 100,
  originalPrice: null,
  percentOff: 0,
  isSaleActive: false,
  isFridayActive: false,
  fridayPrice: null,
  image: '',
  detailImage: '',
  available: true,
  bestSeller: false,
  unitType: 'retail',
  createdAt: '2026-03-01',
  ...overrides,
})

async function renderHome(products: ReturnType<typeof product>[]) {
  vi.mocked(getCatalog).mockResolvedValueOnce({
    ...catalogFixture,
    products,
  })
  const router = getRouter()
  router.update({ history: createMemoryHistory({ initialEntries: ['/'] }) })
  render(<RouterProvider router={router} />)
  await screen.findByRole('heading', { name: 'كل احتياجات بيتك في مكان واحد' })
}

afterEach(() => {
  cleanup()
})

describe('home page sections', () => {
  it('shows a product card without a sale unit', async () => {
    await renderHome([product({ bestSeller: true })])
    expect(screen.queryByText('لكل عبوة')).not.toBeInTheDocument()
  })
  it('hides offers when there is no active dated sale', async () => {
    await renderHome([product()])

    expect(screen.queryByRole('heading', { name: 'العروض' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'عروض الجمعة' })).toBeInTheDocument()

    cleanup()
    await renderHome([
      product({ id: 'active-sale', name: 'عرض نشط', isSaleActive: true }),
      product({ id: 'inactive-sale', name: 'عرض منتهي', isSaleActive: false }),
    ])

    const offersSection = screen.getByRole('region', { name: 'العروض' })
    expect(within(offersSection).getByText('عرض نشط')).toBeInTheDocument()
    expect(within(offersSection).queryByText('عرض منتهي')).not.toBeInTheDocument()
  })

  it('shows the Friday availability label only when the Friday deal is active', async () => {
    await renderHome([
      product({ id: 'friday-product', name: 'عرض الجمعة', price: 75, fridayPrice: 75, isFridayActive: true }),
    ])

    const fridaySection = screen.getByRole('region', { name: 'عروض الجمعة' })
    expect(within(fridaySection).getByText('متاح اليوم')).toBeInTheDocument()
    expect(screen.getByText('٧٥ جنيه')).toBeInTheDocument()

    cleanup()
    await renderHome([
      product({ id: 'friday-product', name: 'عرض الجمعة', fridayPrice: 75, isFridayActive: false }),
    ])

    expect(screen.getByRole('heading', { name: 'عروض الجمعة' })).toBeInTheDocument()
    expect(screen.queryByText('متاح اليوم')).not.toBeInTheDocument()
    expect(screen.getByText(/الجمعة بـ/)).toBeInTheDocument()
  })

  it('lists featured products in picks for you', async () => {
    await renderHome([
      product({ id: 'featured', name: 'اختيار مميز', bestSeller: true }),
      product({ id: 'regular', name: 'منتج عادي' }),
    ])

    expect(screen.getByRole('heading', { name: 'مختارات لك' })).toBeInTheDocument()
    expect(screen.getByText('اختيار مميز')).toBeInTheDocument()
    expect(screen.queryByText('منتج عادي')).not.toBeInTheDocument()
  })

  it('shows the three ordering steps and delivery fee note', async () => {
    await renderHome([])
    const orderSection = screen.getByRole('region', { name: 'كيف تطلب؟' })

    expect(within(orderSection).getAllByRole('listitem').map((step) => step.textContent)).toEqual([
      'اختر منتجاتك',
      'اكتب عنوانك',
      'أكد الطلب على واتساب',
    ])
    expect(within(orderSection).getByText(/يتم الاتفاق على مصاريف التوصيل في المحادثة/)).toBeInTheDocument()
  })
})
