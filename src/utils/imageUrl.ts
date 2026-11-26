export function detailImagePath(cardPath: string) {
  return /^products\/[^/]+\.webp$/i.test(cardPath) ? cardPath.replace(/\.webp$/i, '-detail.webp') : cardPath
}

export function getImageUrl(path: string | null | undefined, size: 'card' | 'detail' = 'card', baseUrl = import.meta.env.VITE_SUPABASE_URL || '') {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  const imagePath = size === 'detail' ? detailImagePath(path) : path
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/catalog/${imagePath.replace(/^\//, '')}`
}
