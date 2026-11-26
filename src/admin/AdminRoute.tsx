import { useLoaderData } from '@tanstack/react-router'
import AdminLayout from './AdminLayout'

export default function AdminRoute() {
  const config = useLoaderData({ from: '/admin' })
  return <AdminLayout supabaseUrl={config.supabaseUrl} anonKey={config.anonKey} />
}
