import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TestProviders } from '../test-utils'
import AdminLayout from './AdminLayout'

const { client } = vi.hoisted(() => ({
  client: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  },
}))

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn(() => client) }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ to, children, activeProps }: { to: string; children: ReactNode; activeProps: Record<string, string> }) => <a href={to} {...(to === '/admin' ? activeProps : {})}>{children}</a>,
  Outlet: () => <p>صفحة القسم</p>,
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  client.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
})

describe('admin layout', () => {
  it('signs in with email and password and opens the admin section', async () => {
    render(<TestProviders><AdminLayout supabaseUrl="https://example.supabase.co" anonKey="public-anon-key" /></TestProviders>)

    fireEvent.change(await screen.findByLabelText('البريد الإلكتروني'), { target: { value: 'owner@example.test' } })
    fireEvent.change(screen.getByLabelText('كلمة المرور'), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: 'دخول' }))

    await waitFor(() => expect(client.auth.signInWithPassword).toHaveBeenCalledWith({ email: 'owner@example.test', password: 'secret' }))
    expect(await screen.findByText('صفحة القسم')).toBeInTheDocument()
  })

  it('shows all navigation tabs, marks the orders tab, and signs out', async () => {
    client.auth.getSession.mockResolvedValue({ data: { session: { user: { id: 'owner' } } }, error: null })
    render(<TestProviders><AdminLayout supabaseUrl="https://example.supabase.co" anonKey="public-anon-key" /></TestProviders>)

    expect(await screen.findByRole('link', { name: 'الطلبات' })).toHaveAttribute('href', '/admin')
    expect(screen.getByRole('link', { name: 'الطلبات' })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByRole('link', { name: 'الأرباح' })).toHaveAttribute('href', '/admin/earnings')
    expect(screen.getByRole('link', { name: 'المنتجات' })).toHaveAttribute('href', '/admin/products')
    expect(screen.getByRole('link', { name: 'الإعدادات' })).toHaveAttribute('href', '/admin/settings')
    fireEvent.click(screen.getByRole('button', { name: 'تسجيل الخروج' }))

    await waitFor(() => expect(client.auth.signOut).toHaveBeenCalled())
    expect(await screen.findByRole('heading', { name: 'دخول المالك' })).toBeInTheDocument()
  })
})
