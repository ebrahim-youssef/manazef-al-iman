import { createFileRoute } from '@tanstack/react-router'
import AdminPlaceholder from '../admin/AdminPlaceholder'

export const Route = createFileRoute('/admin/products')({ component: () => <AdminPlaceholder title="المنتجات" /> })
