import type { DiscountType } from '../pricing/price'

export type ProductDraft = {
  id: string
  category_id: string
  name: string
  brand_id: string
  description: string
  image_path: string
  price_egp: number
  is_available: boolean
  is_featured: boolean
  sale_type: DiscountType
  sale_value: number | null
  sale_starts_at: string | null
  sale_ends_at: string | null
  friday_type: DiscountType
  friday_value: number | null
}

export type ProductFilters = { search: string; categoryId: string; availableOnly: boolean; featuredOnly: boolean }
const cairoDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Cairo', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function formatCairoParts(date: Date) {
  const parts = Object.fromEntries(cairoDateFormatter.formatToParts(date).map(({ type, value }) => [type, value]))
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`
}

function cairoOffsetAt(instant: number) {
  const parts = Object.fromEntries(cairoDateFormatter.formatToParts(new Date(instant)).map(({ type, value }) => [type, value]))
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute)) - instant
}

export function formatCairoDateTime(value: string | null) {
  return value ? formatCairoParts(new Date(value)) : ''
}

export function parseCairoDateTime(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('اختر تاريخًا ووقتًا صالحين.')
  const [datePart, timePart] = value.split('T')
  const [year, month, day] = datePart!.split('-').map(Number)
  const [hour, minute] = timePart!.split(':').map(Number)
  const wallTime = Date.UTC(year!, month! - 1, day!, hour!, minute!)
  const normalized = new Date(wallTime)
  if (normalized.getUTCFullYear() !== year || normalized.getUTCMonth() + 1 !== month || normalized.getUTCDate() !== day
    || normalized.getUTCHours() !== hour || normalized.getUTCMinutes() !== minute) throw new Error('اختر تاريخًا ووقتًا صالحين.')
  const offsets = new Set([-86_400_000, -21_600_000, 0, 21_600_000, 86_400_000].map((offset) => cairoOffsetAt(wallTime + offset)))
  const matchingInstants = [...offsets]
    .map((offset) => wallTime - offset)
    .filter((instant) => formatCairoParts(new Date(instant)) === value)
  if (matchingInstants.length === 0) throw new Error('هذا الوقت غير موجود في توقيت القاهرة بسبب تغيير الساعة.')
  if (matchingInstants.length > 1) throw new Error('هذا الوقت يتكرر في توقيت القاهرة بسبب تغيير الساعة. اختر وقتًا آخر.')
  return new Date(matchingInstants[0]!).toISOString()
}

export function validateProduct(product: ProductDraft) {
  if (!Number.isInteger(product.price_egp) || product.price_egp < 1) return 'أدخل السعر بالجنيه كرقم صحيح لا يقل عن ١.'
  for (const [type, value, label] of [
    [product.sale_type, product.sale_value, 'السعر'],
    [product.friday_type, product.friday_value, 'الجمعة'],
  ] as const) {
    if (type === 'none') continue
    if (!Number.isInteger(value)) return `أدخل قيمة عرض ${label} كرقم صحيح.`
    if (type === 'price' && ((value as number) < 1 || (value as number) >= product.price_egp)) return `أدخل سعر عرض ${label} لا يقل عن ١ وأقل من السعر الأصلي.`
    if (type === 'percent' && ((value as number) < 1 || (value as number) > 90)) return `نسبة عرض ${label} يجب أن تكون من ١ إلى ٩٠.`
  }
  if (product.sale_starts_at && product.sale_ends_at && new Date(product.sale_starts_at) >= new Date(product.sale_ends_at)) return 'يجب أن يبدأ العرض قبل تاريخ انتهائه.'
  return ''
}

export function productImagePaths(imageId: string) {
  return { cardPath: `products/${imageId}.webp`, detailPath: `products/${imageId}-detail.webp` }
}

export function filterProducts<T extends Pick<ProductDraft, 'name' | 'category_id' | 'is_available' | 'is_featured'>>(
  products: T[], filters: ProductFilters,
) {
  const search = filters.search.trim().toLocaleLowerCase()
  return products.filter((product) => (!search || product.name.toLocaleLowerCase().includes(search))
    && (filters.categoryId === 'all' || product.category_id === filters.categoryId)
    && (!filters.availableOnly || product.is_available)
    && (!filters.featuredOnly || product.is_featured))
}

export async function writeProductWithImages({
  upload,
  write,
  removeNew,
  removeOld,
}: {
  upload: () => Promise<string[]>
  write: (paths: string[]) => Promise<{ error: { message: string } | null }>
  removeNew: (paths: string[]) => Promise<void>
  removeOld: () => Promise<void>
}) {
  const uploadedPaths = await upload()
  let error: { message: string } | null
  try {
    ({ error } = await write(uploadedPaths))
  } catch (writeError) {
    await removeNew(uploadedPaths)
    throw writeError
  }
  if (error) {
    await removeNew(uploadedPaths)
    throw new Error(error.message)
  }
  if (uploadedPaths.length > 0) await removeOld()
}
