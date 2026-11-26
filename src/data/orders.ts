import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { calculatePrice, type DiscountType } from '../pricing/price'
import { createOrderCore, type OrderProduct, type PricedOrderLine } from '../checkout/createOrderCore'
import { getImageUrl } from '../utils/imageUrl'

const SUPABASE_TIMEOUT_MS = 8_000

type ProductRow = {
  id: string
  name: string
  unit: string
  image_path: string
  price_egp: number
  is_available: boolean
  sale_type: DiscountType
  sale_value: number | null
  sale_starts_at: string | null
  sale_ends_at: string | null
  friday_type: DiscountType
  friday_value: number | null
}

function toOrderProduct(product: ProductRow): OrderProduct {
  return {
    id: product.id,
    name: product.name,
    unit: product.unit,
    available: product.is_available,
    price: product.price_egp,
    saleType: product.sale_type,
    saleValue: product.sale_value,
    saleStartsAt: product.sale_starts_at,
    saleEndsAt: product.sale_ends_at,
    fridayType: product.friday_type,
    fridayValue: product.friday_value,
  }
}

async function createReadClient() {
  const { env } = await import('cloudflare:workers')
  return {
    env,
    client: createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }) },
    }),
  }
}

export const getCurrentCartLines = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    if (!Array.isArray(data) || !data.every((item) => typeof item === 'object' && item !== null
      && 'id' in item && typeof item.id === 'string' && item.id.length > 0
      && 'quantity' in item && Number.isInteger(item.quantity) && item.quantity > 0)) return []
    const cart = data as { id: string; quantity: number }[]
    if (cart.length === 0) return []
    const { env, client } = await createReadClient()
    const { data: products, error } = await client.from('products')
      .select('id,name,unit,image_path,price_egp,is_available,sale_type,sale_value,sale_starts_at,sale_ends_at,friday_type,friday_value')
      .in('id', [...new Set(cart.map((item) => item.id))])
    if (error) throw new Error(`Cart products could not be loaded: ${error.message}`)
    const productById = new Map((products as ProductRow[]).map((product) => [product.id, product]))
    return cart.map(({ id, quantity }) => {
      const product = productById.get(id)
      if (!product) return { id, quantity, name: 'منتج محذوف', unit: '', image: '', price: 0, available: false }
      const price = calculatePrice(toOrderProduct(product), new Date()).shownPrice
      return {
        id,
        quantity,
        name: product.name,
        unit: product.unit,
        image: getImageUrl(product.image_path, env.SUPABASE_URL),
        price,
        available: product.is_available,
      }
    })
  })

export const createOrder = createServerFn({ method: 'POST' })
  .validator((data: unknown) => data)
  .handler(async ({ data }) => {
    const { env, client } = await createReadClient()
    const rawServiceKey = env.SUPABASE_SERVICE_ROLE_KEY
    if (!rawServiceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured')
    const serviceClient = createClient(env.SUPABASE_URL, rawServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }) },
    })
    let savedOrder: { code: string; items: PricedOrderLine[]; total: number } | undefined
    const order = await createOrderCore(
      data,
      async (ids) => {
        const { data: products, error } = await client.from('products')
          .select('id,name,unit,image_path,price_egp,is_available,sale_type,sale_value,sale_starts_at,sale_ends_at,friday_type,friday_value')
          .in('id', ids)
        if (error) throw new Error(`Order products could not be loaded: ${error.message}`)
        return (products as ProductRow[]).map(toOrderProduct)
      },
      async (items) => {
        // Ticket #5 adds the Turnstile token check here, before the privileged RPC.
        const { data: result, error } = await serviceClient.rpc('create_order', { items })
        if (error) throw new Error(`Order could not be saved: ${error.message}`)
        const resultObject = result as { code: string; items: PricedOrderLine[]; total: number }
        savedOrder = resultObject
        return resultObject.code
      },
    )
    return savedOrder ?? order
  })
