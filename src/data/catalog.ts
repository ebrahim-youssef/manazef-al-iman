import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { mergeShopSettings } from '../config/shopDefaults'
import { getImageUrl } from '../utils/imageUrl'
import { calculatePrice, type DiscountType } from '../pricing/price'

const SUPABASE_TIMEOUT_MS = 8_000

type CategoryRow = { id: string; slug: string; name: string; image_path: string; sort_order: number }
type ProductRow = {
  id: string
  category_id: string
  name: string
  brands: { name: string; arabic_name: string | null }
  description: string
  image_path: string
  price_egp: number
  sale_type: DiscountType
  sale_value: number | null
  sale_starts_at: string | null
  sale_ends_at: string | null
  friday_type: DiscountType
  friday_value: number | null
  is_available: boolean
  is_featured: boolean
  created_at: string
}
type CatalogCategory = { id: string; slug: string; name: string; image: string; description: string }
type CatalogProduct = {
  id: string
  category: string
  name: string
  brand: string
  brandArabicName: string | null
  description: string
  price: number
  originalPrice: number | null
  percentOff: number
  isSaleActive: boolean
  isFridayActive: boolean
  fridayPrice: number | null
  image: string
  detailImage: string
  available: boolean
  bestSeller: boolean
  unitType: string
  createdAt: string
}

function logCatalogFailure(query: string, error: { message?: string; code?: string } | unknown) {
  const message = error instanceof Error
    ? error.message
    : typeof error === 'object' && error !== null && 'message' in error
      ? String(error.message)
      : String(error)
  const code = typeof error === 'object' && error !== null && 'code' in error
    ? String(error.code)
    : undefined
  console.error(`[catalog] ${query} query failed: ${message}`, { code })
}

export type CatalogData = { unavailable: true } | {
  unavailable: false
  categories: CatalogCategory[]
  products: CatalogProduct[]
  settings: ReturnType<typeof mergeShopSettings>
}

async function readCatalog(): Promise<CatalogData> {
  try {
    const { env } = await import('cloudflare:workers')
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }) },
    })
    const [{ data: categories, error: categoryError }, { data: products, error: productError }, { data: settings, error: settingsError }] = await Promise.all([
      client.from('categories').select('*').order('sort_order').order('id').then((result) => {
        if (result.error) logCatalogFailure('categories', result.error)
        return result
      }),
      client.from('products').select('*, brands(name, arabic_name)').order('created_at', { ascending: false }).then((result) => {
        if (result.error) logCatalogFailure('products', result.error)
        return result
      }),
      client.from('settings').select('*').maybeSingle().then((result) => {
        if (result.error) logCatalogFailure('settings', result.error)
        return result
      }),
    ])
    if (categoryError || productError || settingsError) return { unavailable: true }
    return {
      unavailable: false,
      categories: categories.map((category: CategoryRow) => ({ ...category, image: getImageUrl(category.image_path, 'card', env.SUPABASE_URL), description: '' })),
      products: products.map((product: ProductRow) => {
        const pricing = calculatePrice({
          price: product.price_egp,
          saleType: product.sale_type,
          saleValue: product.sale_value,
          saleStartsAt: product.sale_starts_at,
          saleEndsAt: product.sale_ends_at,
          fridayType: product.friday_type,
          fridayValue: product.friday_value,
        }, new Date())

        return {
          ...product,
          brand: product.brands.name,
          brandArabicName: product.brands.arabic_name,
          category: product.category_id,
          price: pricing.shownPrice,
          image: getImageUrl(product.image_path, 'card', env.SUPABASE_URL),
          detailImage: getImageUrl(product.image_path, 'detail', env.SUPABASE_URL),
          available: product.is_available,
          bestSeller: product.is_featured,
          originalPrice: pricing.percentOff > 0 ? pricing.originalPrice : null,
          percentOff: pricing.percentOff,
          isSaleActive: pricing.isSaleActive,
          isFridayActive: pricing.isFridayActive,
          fridayPrice: pricing.fridayPrice,
          unitType: product.category_id === 'wholesale' ? 'wholesale' : 'retail',
          createdAt: product.created_at,
        }
      }),
      settings: mergeShopSettings(settings),
    }
  } catch (error) {
    logCatalogFailure('catalog', error)
    return { unavailable: true }
  }
}

export const getCatalog = createServerFn({ method: 'GET' }).handler(readCatalog)

export const getSearchIndex = createServerFn({ method: 'GET' })
  .handler(async () => {
    const catalog = await readCatalog()
    if (catalog.unavailable) return catalog
    return {
      unavailable: false as const,
      categories: catalog.categories.map(({ id, slug, name }) => ({ id, slug, name })),
      products: catalog.products.map(({ id, name, brand, brandArabicName, category, image, price }) => ({ id, name, brand, brandArabic: brandArabicName, category, image, price })),
    }
  })
