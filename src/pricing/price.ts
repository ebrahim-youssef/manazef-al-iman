export type DiscountType = 'none' | 'price' | 'percent'

export type ProductPricing = {
  price: number
  saleType: DiscountType
  saleValue: number | null
  saleStartsAt: string | null
  saleEndsAt: string | null
  fridayType: DiscountType
  fridayValue: number | null
}

export type PriceResult = {
  originalPrice: number
  shownPrice: number
  percentOff: number
  isSaleActive: boolean
  isFridayActive: boolean
  fridayPrice: number | null
}

const CAIRO_WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Africa/Cairo',
  weekday: 'long',
})

export function calculatePrice(product: ProductPricing, instant: Date | string): PriceResult {
  const now = instant instanceof Date ? instant.getTime() : new Date(instant).getTime()
  const startsAt = product.saleStartsAt === null ? null : new Date(product.saleStartsAt).getTime()
  const endsAt = product.saleEndsAt === null ? null : new Date(product.saleEndsAt).getTime()
  const isSaleActive = product.saleType !== 'none'
    && (startsAt === null || startsAt <= now)
    && (endsAt === null || now < endsAt)
  const isFridayActive = CAIRO_WEEKDAY_FORMATTER.format(new Date(now)) === 'Friday'
  const salePrice = product.saleType === 'price'
    ? product.saleValue
    : product.saleType === 'percent'
      ? Math.round(product.price * (100 - (product.saleValue ?? 0)) / 100)
      : null
  const fridayDealPrice = product.fridayType === 'price'
    ? product.fridayValue
    : product.fridayType === 'percent'
      ? Math.round(product.price * (100 - (product.fridayValue ?? 0)) / 100)
      : null
  const fridayPrice = fridayDealPrice === null ? null : Math.min(product.price, fridayDealPrice)
  const candidates = [
    product.price,
    ...(isSaleActive && salePrice !== null ? [salePrice] : []),
    ...(isFridayActive && fridayPrice !== null ? [fridayPrice] : []),
  ]
  const shownPrice = Math.min(...candidates)

  return {
    originalPrice: product.price,
    shownPrice,
    percentOff: product.price === 0 ? 0 : Math.round((product.price - shownPrice) / product.price * 100),
    isSaleActive,
    isFridayActive,
    fridayPrice,
  }
}
