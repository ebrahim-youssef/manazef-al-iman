import { createFileRoute } from '@tanstack/react-router'
import ProductDetails from '../pages/ProductDetails'
import { getCatalog } from '../data/catalog'

export const Route = createFileRoute('/product/$id')({ loader: () => getCatalog(), component: ProductDetails })
