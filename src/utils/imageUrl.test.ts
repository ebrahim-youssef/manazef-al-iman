import { describe, expect, it } from 'vitest'
import { getImageUrl } from './imageUrl'

describe('getImageUrl', () => {
  it('passes through absolute URLs', () => {
    expect(getImageUrl('https://images.unsplash.com/photo.jpg')).toBe('https://images.unsplash.com/photo.jpg')
  })

  it('resolves storage paths against the configured public bucket', () => {
    expect(getImageUrl('products/item.webp', 'https://shop.test')).toBe('https://shop.test/storage/v1/object/public/catalog/products/item.webp')
  })
})
