import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AdminPage from './AdminPage'

const { client } = vi.hoisted(() => {
  const order = { id: '1', code: 'AB23CD', status: 'new', total_egp: 250, item_count: 2, created_at: '2026-11-25T21:30:00.000Z' }
  const orderItem = { id: 'item-1', product_name: 'صابون محفوظ', unit: 'العبوة', unit_price_egp: 125, quantity: 2, line_total_egp: 250 }
  const authListeners: Array<(event: string, session: unknown) => void> = []
  const client = {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn((listener) => {
        authListeners.push(listener)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [orderItem], error: null }) })),
        order: vi.fn().mockResolvedValue({ data: table === 'orders' ? [order] : [orderItem], error: null }),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }
  return { client }
})

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => client) }))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
})

describe('admin login states', () => {
  it('signs in with email and password and returns to the orders view', async () => {
    render(<AdminPage supabaseUrl="https://example.supabase.co" anonKey="public-anon-key" />)
    await screen.findByRole('heading', { name: 'دخول المالك' })

    fireEvent.change(screen.getByLabelText('البريد الإلكتروني'), { target: { value: 'owner@example.test' } })
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }))

    await waitFor(() => expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'owner@example.test', password: 'secret' }))
    expect(await screen.findByRole('heading', { name: 'الطلبات' })).toBeInTheDocument()
  })

  it('signs out from the order view and returns to login', async () => {
    client.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null })
    render(<AdminPage supabaseUrl="https://example.supabase.co" anonKey="public-anon-key" />)

    fireEvent.click(await screen.findByRole('button', { name: 'تسجيل الخروج' }))

    await waitFor(() => expect(client.auth.signOut).toHaveBeenCalled())
    expect(await screen.findByRole('heading', { name: 'دخول المالك' })).toBeInTheDocument()
  })

  it('opens an order and displays its snapshotted items and status actions', async () => {
    client.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null })
    render(<AdminPage supabaseUrl="https://example.supabase.co" anonKey="public-anon-key" />)

    fireEvent.click(await screen.findByRole('button', { name: /AB23CD/ }))

    expect(await screen.findByRole('heading', { name: 'المنتجات' })).toBeInTheDocument()
    expect(await screen.findByText('صابون محفوظ')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'تم التسليم' }))
    await waitFor(() => expect(client.rpc).toHaveBeenCalledWith('set_order_status', { code: 'AB23CD', next_status: 'fulfilled' }))
  })
})
