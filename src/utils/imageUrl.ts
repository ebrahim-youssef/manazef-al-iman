export function getImageUrl(path: string | null | undefined, baseUrl = import.meta.env.VITE_SUPABASE_URL || '') {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${baseUrl.replace(/\/$/, '')}/storage/v1/object/public/catalog/${path.replace(/^\//, '')}`
}
