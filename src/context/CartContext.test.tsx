import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { CartProvider } from './CartContext'
import { useCart } from './useCart'

afterEach(() => { cleanup(); localStorage.clear() })

it('limits quantities and distinct products in the cart', async () => {
  const { result } = renderHook(() => useCart() as unknown as {
    hasLoaded: boolean
    items: { id: string; quantity: number }[]
    addItem: (product: { id: string }, quantity: number) => void
    updateQty: (id: string, quantity: number) => void
  }, { wrapper: CartProvider })
  await waitFor(() => expect(result.current.hasLoaded).toBe(true))
  act(() => {
    for (let index = 0; index < 51; index += 1) result.current.addItem({ id: String(index) }, 200)
  })
  expect(result.current.items).toHaveLength(50)
  expect(result.current.items[0].quantity).toBe(99)
  act(() => result.current.updateQty('0', 120))
  expect(result.current.items[0].quantity).toBe(99)
})
