import { createFileRoute } from '@tanstack/react-router'
import AdminEarningsPage from '../admin/AdminEarningsPage'

export const Route = createFileRoute('/admin/earnings')({ component: AdminEarningsPage })
