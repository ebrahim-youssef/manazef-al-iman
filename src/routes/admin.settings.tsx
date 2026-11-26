import { createFileRoute } from '@tanstack/react-router'
import AdminPlaceholder from '../admin/AdminPlaceholder'

export const Route = createFileRoute('/admin/settings')({ component: () => <AdminPlaceholder title="الإعدادات" /> })
