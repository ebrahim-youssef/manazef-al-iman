import { createFileRoute } from '@tanstack/react-router'
import AdminSettingsPage from '../admin/AdminSettingsPage'

export const Route = createFileRoute('/admin/settings')({ component: AdminSettingsPage })
