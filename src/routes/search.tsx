import { createFileRoute } from '@tanstack/react-router'
import SearchPage from '../pages/SearchPage'
import { searchCatalog } from '../data/catalog'

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === 'string' ? search.q : '' }),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => searchCatalog({ data: deps.q }),
  component: SearchPage,
})
