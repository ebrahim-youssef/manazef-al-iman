import { useEffect, useState } from 'react'
import { getSearchIndex } from '../data/catalog'

type IndexResult = Awaited<ReturnType<typeof getSearchIndex>>
const SEARCH_INDEX_MAX_AGE_MS = 5 * 60 * 1000
let request: Promise<IndexResult> | undefined
let cachedAt: number | undefined

export function useSearchIndex(enabled = true) {
  const [index, setIndex] = useState<IndexResult | null>(null)
  useEffect(() => {
    if (!enabled) return
    if (cachedAt !== undefined && Date.now() - cachedAt >= SEARCH_INDEX_MAX_AGE_MS) {
      request = undefined
      cachedAt = undefined
    }
    request ??= getSearchIndex().catch(() => ({ unavailable: true as const })).then((result) => {
      if (result.unavailable) request = undefined
      else cachedAt = Date.now()
      return result
    })
    let active = true
    request.then((result) => { if (active) setIndex(result) })
    return () => { active = false }
  }, [enabled])
  return index
}
