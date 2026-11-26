import { calculatePrice, type ProductPricing } from '../pricing/price'

export type CartOrderInput = { id: string; quantity: number }
export type OrderProduct = ProductPricing & {
  id: string
  name: string
  unit: string
  available: boolean
}
export type PricedOrderLine = { id: string; name: string; unit: string; unitPrice: number; quantity: number }

export async function createOrderCore(
  input: unknown,
  getProducts: (ids: string[]) => Promise<OrderProduct[]>,
  saveOrder: (items: PricedOrderLine[]) => Promise<string>,
  instant = new Date(),
) {
  if (!Array.isArray(input) || input.length === 0) throw new Error('Order is empty')
  if (!input.every((item) => typeof item === 'object' && item !== null
    && 'id' in item && typeof item.id === 'string' && item.id.length > 0
    && 'quantity' in item && Number.isInteger(item.quantity) && item.quantity > 0)) {
    throw new Error('Order items must have a product id and positive integer quantity')
  }

  const cart = input as CartOrderInput[]
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
