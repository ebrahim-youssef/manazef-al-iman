import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { TestProviders } from '../test-utils'
import { AdminClientContext } from './AdminClientContext'
import AdminPage from './AdminPage'

const { client, order, orderItem } = (() => {
  const order = { id: '1', code: 'AB23CD', status: 'new', total_egp: 250, item_count: 2, created_at: '2026-11-25T21:30:00.000Z' }
  const orderItem: { id: string; product_name: string; unit: string | null; unit_price_egp: number; quantity: number; line_total_egp: number } = { id: 'item-1', product_name: 'صابون محفوظ', unit: 'العبوة', unit_price_egp: 125, quantity: 2, line_total_egp: 250 }
  const authListeners: Array<(event: string, session: unknown) => void> = []
  const client = {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
        authListeners.push(listener)
        return { data: { subscription: { unsubscribe: () => undefined } } }
      },
    },
    from: vi.fn((table: string) => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({ order: vi.fn().mockResolvedValue({ data: [orderItem], error: null }) })),
        order: vi.fn().mockResolvedValue({ data: table === 'orders' ? [order] : [orderItem], error: null }),
      })),
    })),
    rpc: vi.fn().mockResolvedValue({ error: null }),
  }
  return { client, order, orderItem }
})()

function renderOrders() {
  return render(<TestProviders><AdminClientContext.Provider value={client as never}><AdminPage /></AdminClientContext.Provider></TestProviders>)
}

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  orderItem.unit = 'العبوة'
})

describe('admin orders', () => {
  it('opens an order and displays its snapshotted items and status actions', async () => {
    renderOrders()

    fireEvent.click(await screen.findByRole('button', { name: /AB23CD/ }))

    expect(await screen.findByRole('heading', { name: 'المنتجات' })).toBeInTheDocument()
    expect(await screen.findByText('صابون محفوظ')).toBeInTheDocument()
    expect(screen.getByText(/العبوة/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'إعادة إلى جديد' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'تم التسليم' }))
    await waitFor(() => expect(client.rpc).toHaveBeenCalled())
  })

  it('omits the unit separator for a new order item', async () => {
    orderItem.unit = null
    renderOrders()
    fireEvent.click(await screen.findByRole('button', { name: /AB23CD/ }))
    expect(await screen.findByText('صابون محفوظ')).toBeInTheDocument()
    expect(screen.queryByText(/ · /)).not.toBeInTheDocument()
  })

  it('refetches orders and exposes a loading state', async () => {
    let finishRefresh: ((value: { data: Array<typeof order>; error: null }) => void) | undefined
    renderOrders()
    await screen.findByRole('button', { name: /AB23CD/ })
    client.from.mockImplementationOnce(() => ({
      select: vi.fn(() => ({
        order: vi.fn(() => new Promise((resolve) => { finishRefresh = resolve })),
      })),
    }) as never)

    fireEvent.click(screen.getByRole('button', { name: 'تحديث الطلبات' }))

    expect(await screen.findByRole('button', { name: 'جارٍ تحديث الطلبات…' })).toBeDisabled()
    finishRefresh?.({ data: [order], error: null })
    await waitFor(() => expect(screen.getByRole('button', { name: 'تحديث الطلبات' })).toBeEnabled())
  })
})
