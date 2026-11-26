import { createFileRoute } from '@tanstack/react-router'
import AdminRoute from '../admin/AdminRoute'
import { getAdminConfig } from '../data/adminConfig'

export const Route = createFileRoute('/admin')({
  loader: () => getAdminConfig(),
  component: AdminRoute,
})
