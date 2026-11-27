import { useEffect, useState } from 'react'
import { getSearchIndex } from '../data/catalog'

type IndexResult = Awaited<ReturnType<typeof getSearchIndex>>
let request: Promise<IndexResult> | undefined

export function useSearchIndex() {
  const [index, setIndex] = useState<IndexResult | null>(null)
  useEffect(() => {
    request ??= getSearchIndex().catch(() => ({ unavailable: true as const }))
    let active = true
    request.then((result) => { if (active) setIndex(result) })
    return () => { active = false }
  }, [])
  return index
}
