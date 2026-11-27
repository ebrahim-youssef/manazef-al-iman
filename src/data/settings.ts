import { createServerFn } from '@tanstack/react-start'
import { createClient } from '@supabase/supabase-js'
import { mergeShopSettings } from '../config/shopDefaults'
import { categories as fallbackCategories } from './categories'

const SUPABASE_TIMEOUT_MS = 8_000

async function readShopSettings() {
  try {
    const { env } = await import('cloudflare:workers')
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }) },
    })
    const { data, error } = await client.from('settings').select('*').maybeSingle()
    if (error) throw error
    return mergeShopSettings(data)
  } catch (reason) {
    console.error('Failed to load shop settings; using configured defaults.', reason)
    return mergeShopSettings(null)
  }
}

export const getShopSettings = createServerFn({ method: 'GET' }).handler(readShopSettings)

async function readNavigationCategories() {
  try {
    const { env } = await import('cloudflare:workers')
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(SUPABASE_TIMEOUT_MS) }) },
    })
    const { data, error } = await client.from('categories').select('id, slug, name').order('sort_order').order('id')
    if (error) throw error
    return data
  } catch (reason) {
    console.error('Failed to load navigation categories; using defaults.', reason)
    return fallbackCategories.map(({ id, slug, name }) => ({ id, slug, name }))
  }
}

export const getNavigationCategories = createServerFn({ method: 'GET' }).handler(readNavigationCategories)
