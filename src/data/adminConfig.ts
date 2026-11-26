import { createServerFn } from '@tanstack/react-start'

export const getAdminConfig = createServerFn({ method: 'GET' }).handler(async () => {
  try {
    const { env } = await import('cloudflare:workers')
    return { supabaseUrl: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY }
  } catch (reason) {
    console.error('Failed to load public Supabase configuration for admin login.', reason)
    return { supabaseUrl: null, anonKey: null }
  }
})
