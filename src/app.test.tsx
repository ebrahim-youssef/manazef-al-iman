import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { getRouter } from './router'
import { CartProvider } from './context/CartContext'
import { useCart } from './context/useCart'
import { products } from './data/products'
import { getCatalog } from './data/catalog'
import { createOrder } from './data/orders'

// The first /admin render loads supabase-js, which can pass the 1 s default under full-suite load.
const ADMIN_FIRST_RENDER_TIMEOUT_MS = 5_000

type TurnstileOptions = Parameters<NonNullable<Window['turnstile']>['render']>[1]

const { catalogFixture, shopSettingsFixture } = vi.hoisted(() => ({ catalogFixture: {
  unavailable: false as const,
  categories: [
    { id: 'cleaners', slug: 'cleaners', name: 'منظفات', image: '', description: '' },
    { id: 'cosmetics', slug: 'cosmetics', name: 'مستحضرات تجميل', image: '', description: '' },
  ],
  products: [{
    id: 'cos-1', name: 'شامبو Sunsilk لشعر ناعم 600 مل', category: 'cosmetics', price: 85,
    originalPrice: null, unit: 'العبوة', unitType: 'retail', brand: 'Sunsilk', image: '', detailImage: '', description: '',
    available: true, bestSeller: true, createdAt: '2026-03-01',
  }],
  settings: {},
}, shopSettingsFixture: {
  shop_name: 'منظفات الإيمان',
  whatsapp_number: '201012345678',
  phone_number: '0109 796 1866',
  address: 'القاهرة، مصر',
  map_lat: 30.0444,
  map_lng: 31.2357,
  opening_hours_text: 'يوميًا 9 ص - 10 م',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  tiktok_url: 'https://tiktok.com/@shop',
  delivery_areas: ['القاهرة'],
} }))

vi.mock('./data/catalog', () => ({
  getCatalog: vi.fn().mockResolvedValue(catalogFixture),
  searchCatalog: vi.fn().mockResolvedValue(catalogFixture),
}))

vi.mock('./data/settings', () => ({
  getShopSettings: vi.fn().mockResolvedValue(shopSettingsFixture),
  getNavigationCategories: vi.fn().mockResolvedValue(catalogFixture.categories),
}))

vi.mock('./data/orders', () => ({
  getCurrentCartLines: vi.fn().mockResolvedValue([{
    id: 'cos-1', quantity: 1, name: 'شامبو', unit: 'العبوة', image: '', price: 80, available: true,
  }]),
  createOrder: vi.fn(),
  getTurnstileSiteKey: vi.fn().mockResolvedValue('1x00000000000000000000AA'),
}))

vi.mock('./data/adminConfig', () => ({
  getAdminConfig: vi.fn().mockResolvedValue({ supabaseUrl: 'http://127.0.0.1:54321', anonKey: 'test-anon-key' }),
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
  document.querySelectorAll('script[data-turnstile]').forEach((script) => script.remove())
  delete window.turnstile
})

describe('store routes', () => {
  it('keeps the right-to-left shell, search, cart and phone usable', async () => {
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/'] }) })
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('link', { name: /سلة التسوق/ }, { timeout: 5_000 })).toHaveAttribute('href', '/cart')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(screen.getByRole('link', { name: '0109 796 1866' })).toHaveAttribute('href', 'tel:01097961866')
    fireEvent.click(screen.getByRole('button', { name: 'بحث' }))
    fireEvent.change(screen.getByRole('searchbox', { name: 'البحث في المتجر' }), { target: { value: 'شامبو' } })
    fireEvent.submit(screen.getByRole('search'))
    await waitFor(() => expect(router.state.location.href).toContain('/search?q='))
  })
  it('uses the current shop settings in the header and footer', async () => {
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/'] }) })
    render(<RouterProvider router={router} />)
    const headerLink = await screen.findByRole('link', { name: 'تواصل معنا عبر واتساب' })
    expect(headerLink).toHaveAttribute('href', 'https://wa.me/201012345678')
    expect(screen.getByRole('link', { name: 'تيك توك' })).toHaveAttribute('href', 'https://tiktok.com/@shop')
    expect(screen.getByRole('link', { name: '0109 796 1866' })).toHaveAttribute('href', 'tel:01097961866')
    expect(screen.getByRole('link', { name: '0109 796 1866' })).toHaveAttribute('dir', 'ltr')
    expect(screen.getByRole('link', { name: '01012345678' })).toHaveAttribute('href', 'https://wa.me/201012345678')
    expect(screen.getByRole('link', { name: '01012345678' })).toHaveAttribute('dir', 'ltr')
  })
  it.each([
    ['/', 'كل احتياجات بيتك في مكان واحد'],
    ['/category/cleaners', 'منظفات'],
    ['/product/cos-1', 'شامبو Sunsilk لشعر ناعم 600 مل'],
    ['/cart', 'سلة التسوق'],
    ['/search', 'البحث'],
  ])('renders the main heading at %s', async (path, heading) => {
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: [path] }) })
    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it('renders the owner frame without customer cart or visit section', async () => {
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/admin'] }) })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'دخول المالك' }, { timeout: ADMIN_FIRST_RENDER_TIMEOUT_MS })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /سلة التسوق/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'زورنا' })).not.toBeInTheDocument()
  })

  it('renders the WhatsApp outage state when the catalog data layer is unavailable', async () => {
    vi.mocked(getCatalog).mockResolvedValueOnce({ unavailable: true })
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/'] }) })
    render(<RouterProvider router={router} />)
    expect(await screen.findByText('يمكننا مساعدتك في طلب منتجاتك')).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'تواصل معنا على واتساب' }).map((link) => link.getAttribute('href')))
      .toContain(`https://wa.me/${shopSettingsFixture.whatsapp_number}`)
  })
})

function CartControls() {
  const { items, hasLoaded, addItem, removeItem } = useCart() as unknown as {
    items: unknown[]
    hasLoaded: boolean
    addItem: (product: (typeof products)[number]) => void
    removeItem: (id: string) => void
  }
  return (
    <div>
      <button onClick={() => addItem(products[0])}>أضف</button>
      <button onClick={() => removeItem(products[0].id)}>احذف</button>
      <output>{items.length}</output>
      <output aria-label="تم تحميل السلة">{String(hasLoaded)}</output>
    </div>
  )
}

describe('cart', () => {
  it('loads the saved cart after the empty initial render without overwriting it', async () => {
    const savedCart = [{ id: products[0].id, quantity: 2 }]
    localStorage.setItem('iman-cart', JSON.stringify(savedCart))

    const initialHtml = renderToString(<CartProvider><CartControls /></CartProvider>)
    expect(initialHtml).toContain('<output>0</output>')
    expect(localStorage.getItem('iman-cart')).toBe(JSON.stringify(savedCart))
    render(<CartProvider><CartControls /></CartProvider>)
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    expect(screen.getByLabelText('تم تحميل السلة')).toHaveTextContent('true')
    expect(localStorage.getItem('iman-cart')).toBe(JSON.stringify(savedCart))
  })

  it('leaves CartPage loading after the cart context loads', async () => {
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/cart'] }) })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'سلة التسوق فارغة' })).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('makes each checkout field reachable by its label', async () => {
    localStorage.setItem('iman-cart', JSON.stringify([{ id: 'cos-1', quantity: 1 }]))
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/cart'] }) })
    render(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: 'بيانات التوصيل' })).toBeInTheDocument()
    expect(screen.getByLabelText('الاسم')).toBeInTheDocument()
    expect(screen.getByLabelText(/رقم الموبايل/)).toBeInTheDocument()
    expect(screen.getByLabelText(/رقم الموبايل/)).toHaveAttribute('dir', 'ltr')
    expect(screen.getByLabelText('المنطقة')).toBeInTheDocument()
    expect(screen.getByLabelText('العنوان')).toBeInTheDocument()
    expect(screen.getByLabelText('ملاحظات اختيارية')).toBeInTheDocument()
  })

  it('keeps one Turnstile widget across quantity changes and removes it when the cart empties', async () => {
    localStorage.setItem('iman-cart', JSON.stringify([{ id: 'cos-1', quantity: 1 }]))
    const turnstile = {
      render: vi.fn(() => 'widget-1'),
      reset: vi.fn(),
      execute: vi.fn(),
      remove: vi.fn(),
    }
    window.turnstile = turnstile
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/cart'] }) })
    render(<RouterProvider router={router} />)

    const quantity = await screen.findByLabelText('كمية شامبو')
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1))
    fireEvent.change(quantity, { target: { value: '2' } })
    await waitFor(() => expect(screen.getByLabelText('كمية شامبو')).toHaveValue(2))
    expect(turnstile.render).toHaveBeenCalledTimes(1)
    expect(turnstile.remove).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'تفريغ السلة' }))
    expect(await screen.findByRole('heading', { name: 'سلة التسوق فارغة' })).toBeInTheDocument()
    expect(turnstile.remove).toHaveBeenCalledWith('widget-1')
  })

  it('retries Turnstile after a widget error and reports failure only after submit', async () => {
    localStorage.setItem('iman-cart', JSON.stringify([{ id: 'cos-1', quantity: 1 }]))
    localStorage.setItem('iman-checkout', JSON.stringify({
      name: 'عميل', phone: '01012345678', area: 'القاهرة', address: 'شارع النصر', notes: '',
    }))
    let widgetOptions: TurnstileOptions | undefined
    const turnstile = {
      render: vi.fn((_container: HTMLElement, options: TurnstileOptions) => {
        widgetOptions = options
        return 'widget-1'
      }),
      reset: vi.fn(),
      execute: vi.fn(() => widgetOptions?.['error-callback']()),
      remove: vi.fn(),
    }
    window.turnstile = turnstile
    const router = getRouter()
    router.update({ history: createMemoryHistory({ initialEntries: ['/cart'] }) })
    render(<RouterProvider router={router} />)

    const submit = await screen.findByRole('button', { name: 'تأكيد الطلب عبر واتساب' })
    await waitFor(() => expect(turnstile.render).toHaveBeenCalledTimes(1))
    await waitFor(() => expect(submit).toBeEnabled())
    act(() => widgetOptions?.['error-callback']())
    expect(submit).toBeEnabled()
    expect(screen.queryByText('تعذّر إرسال طلبك الآن. حاول مرة أخرى بعد قليل، أو أرسل طلبك مباشرة عبر واتساب.')).not.toBeInTheDocument()

    fireEvent.click(submit)
    await waitFor(() => expect(turnstile.reset).toHaveBeenCalledWith('widget-1'))
    expect(turnstile.execute).toHaveBeenCalledTimes(1)
    expect(turnstile.reset.mock.invocationCallOrder[0]!).toBeLessThan(turnstile.execute.mock.invocationCallOrder[0]!)
    await waitFor(() => expect(screen.getByText('تعذّر إرسال طلبك الآن. حاول مرة أخرى بعد قليل، أو أرسل طلبك مباشرة عبر واتساب.')).toBeInTheDocument())
    expect(screen.getByRole('alert').querySelector('a')).toHaveAttribute('href', 'https://wa.me/201012345678')
    expect(submit).toBeEnabled()
    expect(createOrder).not.toHaveBeenCalled()
  })

  it('adds and removes a product', async () => {
    render(<CartProvider><CartControls /></CartProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'أضف' }))
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'احذف' }))
    await waitFor(() => expect(screen.getByText('0')).toBeInTheDocument())
  })
})
