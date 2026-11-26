import { createContext, useContext } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

export const AdminClientContext = createContext<SupabaseClient | null>(null)

export function useAdminClient() {
  const client = useContext(AdminClientContext)
  if (!client) throw new Error('AdminClientContext must be provided to admin pages.')
  return client
}
