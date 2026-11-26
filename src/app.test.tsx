import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router'
import { renderToString } from 'react-dom/server'
import { afterEach, describe, expect, it } from 'vitest'
import { getRouter } from './router'
import { CartProvider } from './context/CartContext'
import { useCart } from './context/useCart'
import { products } from './data/products'

afterEach(() => {
  cleanup()
  localStorage.clear()
})

describe('store routes', () => {
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
})

function CartControls() {
  const { items, addItem, removeItem } = useCart() as unknown as {
    items: unknown[]
    addItem: (product: (typeof products)[number]) => void
    removeItem: (id: string) => void
  }
  return (
    <div>
      <button onClick={() => addItem(products[0])}>أضف</button>
      <button onClick={() => removeItem(products[0].id)}>احذف</button>
      <output>{items.length}</output>
    </div>
  )
}

describe('cart', () => {
  it('loads the saved cart after the empty initial render without overwriting it', async () => {
    const savedCart = [{ ...products[0], quantity: 2 }]
    localStorage.setItem('iman-cart', JSON.stringify(savedCart))

    const initialHtml = renderToString(<CartProvider><CartControls /></CartProvider>)
    expect(initialHtml).toContain('<output>0</output>')
    expect(localStorage.getItem('iman-cart')).toBe(JSON.stringify(savedCart))
    render(<CartProvider><CartControls /></CartProvider>)
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    expect(localStorage.getItem('iman-cart')).toBe(JSON.stringify(savedCart))
  })

  it('adds and removes a product', async () => {
    render(<CartProvider><CartControls /></CartProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'أضف' }))
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'احذف' }))
    await waitFor(() => expect(screen.getByText('0')).toBeInTheDocument())
  })
})
