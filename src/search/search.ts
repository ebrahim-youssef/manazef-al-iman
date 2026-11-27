export type SearchProduct = { id: string; name: string; brand: string; brandArabic?: string | null; category: string; image: string; price: number }
export type SearchCategory = { id: string; slug: string; name: string }
export type SearchIndex<P extends SearchProduct = SearchProduct, C extends SearchCategory = SearchCategory> = { products: P[]; categories: C[] }

export function normalizeSearch(value: string) {
  return value.toLowerCase().replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06edـ]/g, '').trim().replace(/\s+/g, ' ')
}

function distance(left: string, right: string, limit: number) {
  if (Math.abs(left.length - right.length) > limit) return limit + 1
  const rows = Array.from({ length: left.length + 1 }, () => Array<number>(right.length + 1).fill(0))
  for (let i = 0; i <= left.length; i++) rows[i]![0] = i
  for (let j = 0; j <= right.length; j++) rows[0]![j] = j
  for (let i = 1; i <= left.length; i++) {
    for (let j = 1; j <= right.length; j++) {
      rows[i]![j] = Math.min(rows[i - 1]![j]! + 1, rows[i]![j - 1]! + 1, rows[i - 1]![j - 1]! + Number(left[i - 1] !== right[j - 1]))
      if (i > 1 && j > 1 && left[i - 1] === right[j - 2] && left[i - 2] === right[j - 1]) {
        rows[i]![j] = Math.min(rows[i]![j]!, rows[i - 2]![j - 2]! + 1)
      }
    }
  }
  return rows[left.length]![right.length]!
}

function rank(term: string, value: string) {
  const normalized = normalizeSearch(value)
  if (!normalized) return Infinity
  if (normalized === term) return 0
  if (normalized.startsWith(term)) return 1
  if (normalized.includes(term)) return 2
  const queryWords = term.split(' ')
  const words = normalized.split(' ')
  let edits = 0
  for (const queryWord of queryWords) {
    const limit = queryWord.length <= 3 ? 0 : queryWord.length <= 6 ? 1 : 2
    const best = Math.min(...words.map((word) => word.length <= 3 && word !== queryWord ? Infinity : distance(queryWord, word, limit)))
    if (best > limit) return Infinity
    edits += best
  }
  return 3 + edits
}

export function searchIndex<P extends SearchProduct, C extends SearchCategory>(index: SearchIndex<P, C>, query: string) {
  const term = normalizeSearch(query.slice(0, 60))
  if (!term) return { products: [] as P[], categories: [] as C[], didYouMean: null as string | null }
  const categoryNames = new Map(index.categories.map((category) => [category.id, category.name]))
  const products = index.products.map((product, order) => ({ product, order, score: Math.min(...[product.name, product.brand, product.brandArabic ?? '', categoryNames.get(product.category) ?? ''].map((value) => rank(term, value))) }))
    .filter((entry) => Number.isFinite(entry.score)).sort((a, b) => a.score - b.score || a.order - b.order).map((entry) => entry.product)
  const categories = index.categories.map((category, order) => ({ category, order, score: rank(term, category.name) }))
    .filter((entry) => Number.isFinite(entry.score)).sort((a, b) => a.score - b.score || a.order - b.order).map((entry) => entry.category)
  let didYouMean: string | null = null
  if (!products.length && !categories.length && term.length > 3) {
    let best = 3
    const terms = [...index.products.flatMap((product) => [product.name, product.brand, product.brandArabic ?? '']), ...index.categories.map((category) => category.name)]
    for (const value of terms) for (const word of value.split(/\s+/)) {
      if (normalizeSearch(word).length <= 3) continue
      const score = distance(term, normalizeSearch(word), 2)
      if (score < best) { best = score; didYouMean = word }
    }
  }
  return { products, categories, didYouMean }
}
