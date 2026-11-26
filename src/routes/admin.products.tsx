import { createFileRoute } from '@tanstack/react-router'
import AdminProductsPage from '../admin/AdminProductsPage'

export const Route = createFileRoute('/admin/products')({ component: AdminProductsPage })
