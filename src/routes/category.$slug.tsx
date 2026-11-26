import { createFileRoute } from '@tanstack/react-router'
import CategoryPage from '../pages/CategoryPage'
import { getCatalog } from '../data/catalog'

export const Route = createFileRoute('/category/$slug')({ loader: () => getCatalog(), component: CategoryPage })
