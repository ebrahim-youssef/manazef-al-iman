import { calculatePrice, type ProductPricing } from '../pricing/price'

export type CartOrderInput = { id: string; quantity: number }
export type OrderProduct = ProductPricing & {
  id: string
  name: string
  unit: string
  available: boolean
}
export type PricedOrderLine = { id: string; name: string; unit: string; unitPrice: number; quantity: number }

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
  if (distinctIds.size > 50) throw new Error(`Order has ${distinctIds.size} distinct items; maximum is 50`)
  if (input.length > 50) throw new Error(`Order has ${input.length} item entries; maximum is 50`)
  for (const item of cart) {
    if (item.quantity < 1 || item.quantity > 99) {
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
    return [{ id, name: product.name, unit: product.unit, unitPrice: price, quantity }]
  })
  if (items.length === 0) throw new Error('No available products in order')

  const code = await saveOrder(items)
  return { code, items, total: items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0) }
}
