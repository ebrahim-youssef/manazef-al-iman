import { createFileRoute } from '@tanstack/react-router'
import SearchPage from '../pages/SearchPage'
import { getCatalog } from '../data/catalog'

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === 'string' ? search.q : '' }),
  loader: () => getCatalog(),
  component: SearchPage,
})
