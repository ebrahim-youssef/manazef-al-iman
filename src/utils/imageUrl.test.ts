import { describe, expect, it } from 'vitest'
import { getImageUrl } from './imageUrl'

describe('getImageUrl', () => {
  it('passes through absolute URLs', () => {
    expect(getImageUrl('https://images.unsplash.com/photo.jpg')).toBe('https://images.unsplash.com/photo.jpg')
  })

  it('resolves storage paths against the configured public bucket', () => {
    expect(getImageUrl('products/item.webp', 'card', 'https://shop.test')).toBe('https://shop.test/storage/v1/object/public/catalog/products/item.webp')
  })

  it('derives the detail image name from the stored card image path', () => {
    expect(getImageUrl('products/item.webp', 'detail', 'https://shop.test')).toBe('https://shop.test/storage/v1/object/public/catalog/products/item-detail.webp')
  })

  it('derives the detail image name for category images too', () => {
    expect(getImageUrl('categories/item.webp', 'detail', 'https://shop.test')).toBe('https://shop.test/storage/v1/object/public/catalog/categories/item-detail.webp')
  })

  it('uses the supplied base URL and leaves legacy paths unchanged', () => {
    expect(getImageUrl('legacy.webp', 'card', 'https://shop.test')).toBe('https://shop.test/storage/v1/object/public/catalog/legacy.webp')
    expect(getImageUrl('legacy.webp', 'detail', 'https://shop.test')).toBe('https://shop.test/storage/v1/object/public/catalog/legacy.webp')
  })
})
