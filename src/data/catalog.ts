import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { mergeShopSettings } from '../config/shopDefaults'
import { getImageUrl } from '../utils/imageUrl'

const SUPABASE_TIMEOUT_MS = 8_000

type CategoryRow = { id: string; slug: string; name: string; image_path: string; sort_order: number }
type ProductRow = {
  id: string
  category_id: string
  name: string
  brand: string
  unit: string
  description: string
  image_path: string
  price_egp: number
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
  unit: string
  description: string
  price: number
  image: string
  available: boolean
  bestSeller: boolean
  originalPrice: null
  unitType: string
  createdAt: string
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
      client.from('categories').select('*').order('sort_order'),
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('settings').select('*').maybeSingle(),
    ])
    if (categoryError || productError || settingsError) return { unavailable: true }
    return {
      unavailable: false,
      categories: categories.map((category: CategoryRow) => ({ ...category, image: getImageUrl(category.image_path, env.SUPABASE_URL), description: '' })),
      products: products.map((product: ProductRow) => ({
        ...product,
        category: product.category_id,
        price: product.price_egp,
        image: getImageUrl(product.image_path, env.SUPABASE_URL),
        available: product.is_available,
        bestSeller: product.is_featured,
        originalPrice: null,
        unitType: product.category_id === 'wholesale' ? 'wholesale' : 'retail',
        createdAt: product.created_at,
      })),
      settings: mergeShopSettings(settings),
    }
  } catch {
    return { unavailable: true }
  }
}

export const getCatalog = createServerFn({ method: 'GET' }).handler(readCatalog)

export const searchCatalog = createServerFn({ method: 'GET' })
  .validator((query: string) => query)
  .handler(async ({ data: query }) => {
    const catalog = await readCatalog()
    if (catalog.unavailable || !query.trim()) return catalog
    const term = query.trim().toLocaleLowerCase()
    return {
      ...catalog,
      products: catalog.products.filter((product) => {
        const category = catalog.categories.find((item) => item.id === product.category)
        return product.name.toLocaleLowerCase().includes(term)
          || product.brand.toLocaleLowerCase().includes(term)
          || category?.name.toLocaleLowerCase().includes(term)
      }),
    }
  })
