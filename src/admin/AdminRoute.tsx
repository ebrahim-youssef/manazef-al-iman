import { useLoaderData } from '@tanstack/react-router'
import AdminPage from './AdminPage'

export default function AdminRoute() {
  const config = useLoaderData({ from: '/admin' })
  return <AdminPage supabaseUrl={config.supabaseUrl} anonKey={config.anonKey} />
}
