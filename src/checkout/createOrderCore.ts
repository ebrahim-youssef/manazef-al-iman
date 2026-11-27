import { calculatePrice, type ProductPricing } from '../pricing/price'
import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from './cartLimits'

export type CartOrderInput = { id: string; quantity: number }
export type OrderProduct = ProductPricing & {
  id: string
  name: string
  available: boolean
}
export type PricedOrderLine = { id: string; name: string; unitPrice: number; quantity: number }

export function validateOrderItems(input: unknown): CartOrderInput[] {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Order is empty; expected at least 1 item')
  for (const [index, item] of input.entries()) {
    if (typeof item !== 'object' || item === null || Array.isArray(item)) {
      throw new Error(`Order item at index ${index} is ${String(item)}; expected an object`)
    }
    const orderItem = item as Record<string, unknown>
    if (typeof orderItem.id !== 'string' || orderItem.id.length === 0) {
      throw new Error(`Order item at index ${index} has id ${String(orderItem.id)}; expected a non-empty string`)
    }
    if (!Number.isInteger(orderItem.quantity)) {
      throw new Error(`${orderItem.id} has quantity ${String(orderItem.quantity)}; expected an integer from 1 to 99`)
    }
  }

  const cart = input as CartOrderInput[]
  const distinctIds = new Set(cart.map((item) => item.id))
  if (distinctIds.size > MAX_CART_ITEMS) throw new Error(`Order has ${distinctIds.size} distinct items; maximum is ${MAX_CART_ITEMS}`)
  if (input.length > MAX_CART_ITEMS) throw new Error(`Order has ${input.length} item entries; maximum is ${MAX_CART_ITEMS}`)
  for (const item of cart) {
    if (item.quantity < 1 || item.quantity > MAX_ITEM_QUANTITY) {
      throw new Error(`${item.id} has quantity ${item.quantity}; expected an integer from 1 to 99`)
    }
  }
  if (distinctIds.size !== cart.length) throw new Error('Order contains duplicate product ids; send one item per product')
  return cart
}

export async function createOrderCore(
  input: unknown,
  getProducts: (ids: string[]) => Promise<OrderProduct[]>,
  saveOrder: (items: PricedOrderLine[]) => Promise<string>,
  instant = new Date(),
) {
  const cart = validateOrderItems(input)
  const products = await getProducts([...new Set(cart.map((item) => item.id))])
  const productById = new Map(products.map((product) => [product.id, product]))
  const items = cart.flatMap(({ id, quantity }) => {
    const product = productById.get(id)
    if (!product?.available) return []
    const price = calculatePrice(product, instant).shownPrice
    return [{ id, name: product.name, unitPrice: price, quantity }]
  })
  if (items.length === 0) throw new Error('No available products in order')

  const code = await saveOrder(items)
  return { code, items, total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) }
}
