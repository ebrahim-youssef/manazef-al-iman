import { describe, expect, it } from 'vitest'
import { normalizeSearch, searchIndex } from './search'

const index = {
  products: [
    { id: '1', name: 'بريل', brand: 'Pril', category: 'cleaners', image: '', price: 10 },
    { id: '2', name: 'أريال', brand: 'Ariel', category: 'cleaners', image: '', price: 20 },
    { id: '3', name: 'منظفة', brand: '', category: 'cleaners', image: '', price: 30 },
    { id: '4', name: 'بريل سائل', brand: '', category: 'cleaners', image: '', price: 40 },
  ],
  categories: [{ id: 'cleaners', slug: 'cleaners', name: 'تنظيف' }],
}

describe('catalog search', () => {
  it('normalizes U+06D6 to the same brand name as SQL', () => {
    expect(normalizeSearch('أر\u06d6يال')).toBe('اريال')
  })
  it('finds near misses and normalizes Arabic letters', () => {
    expect(searchIndex(index, 'بريلل').products[0]?.id).toBe('1')
    expect(searchIndex(index, 'اريال').products[0]?.id).toBe('2')
    expect(searchIndex(index, 'منظفه').products[0]?.id).toBe('3')
  })

  it('does not fuzzy match short words and keeps ties in index order', () => {
    expect(searchIndex(index, 'برل').products).toHaveLength(0)
    expect(searchIndex(index, 'بريل').products.map((product) => product.id)).toEqual(['1', '4'])
    const tied = { ...index, products: [index.products[0]!, { ...index.products[0]!, id: '5' }] }
    expect(searchIndex(tied, 'بريل').products.map((product) => product.id)).toEqual(['1', '5'])
  })

  it('finds Arabic brand aliases, categories and transposed letters', () => {
    const aliased = { ...index, products: [{ ...index.products[0]!, name: 'سائل', brandArabic: 'بريل' }] }
    expect(searchIndex(aliased, 'بريل').products[0]?.id).toBe('1')
    expect(searchIndex(index, 'تنظيف').categories[0]?.id).toBe('cleaners')
    expect(searchIndex(index, 'بيرل').products[0]?.id).toBe('1')
  })

  it('offers the nearest term when no result matches', () => {
    expect(searchIndex(index, 'بريللل').didYouMean).toBe('بريل')
  })
})
