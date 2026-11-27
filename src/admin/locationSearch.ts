export type LocationPoint = { lat: number; lng: number }
export type PlaceResult = LocationPoint & { name: string }

export function reserveSearchTime(now: number, previous: number) {
  const time = Math.max(now, previous + 1000)
  return { time, delayMs: time - now }
}

export function mapSearchResults(data: unknown): PlaceResult[] {
  if (!Array.isArray(data)) return []
  return data.flatMap((item: unknown) => {
    if (!item || typeof item !== 'object') return []
    const result = item as Record<string, unknown>
    if (typeof result.display_name !== 'string' || !result.display_name.trim() || typeof result.lat !== 'string' || typeof result.lon !== 'string' || !result.lat.trim() || !result.lon.trim()) return []
    const lat = Number(result.lat)
    const lng = Number(result.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return []
    return [{ name: result.display_name, lat, lng }]
  }).slice(0, 5)
}
