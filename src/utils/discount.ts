export function getDiscountPercent(product: { price: number; originalPrice: number | null }) {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
}
