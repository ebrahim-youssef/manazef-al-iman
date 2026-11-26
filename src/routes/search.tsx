import { createFileRoute } from '@tanstack/react-router'
import SearchPage from '../pages/SearchPage'

export const Route = createFileRoute('/search')({
  validateSearch: (search: Record<string, unknown>) => ({ q: typeof search.q === 'string' ? search.q : '' }),
  component: SearchPage,
})
