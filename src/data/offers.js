import { products } from './products';

export const offerProducts = products.filter((p) => p.originalPrice && p.originalPrice > p.price);

export function getDiscountPercent(product) {
  if (!product.originalPrice || product.originalPrice <= product.price) return 0;
  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}
