import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminClientContext } from './AdminClientContext'
import AdminEarningsPage from './AdminEarningsPage'

const { client, query } = vi.hoisted(() => {
  const query = {
    select: vi.fn(),
    eq: vi.fn(),
    gte: vi.fn().mockResolvedValue({
      data: [{ created_at: new Date().toISOString(), total_egp: 120, status: 'fulfilled' }],
      error: null,
    }),
  }
  query.select.mockReturnValue(query)
  query.eq.mockReturnValue(query)
  return { client: { from: vi.fn(() => query) }, query }
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('admin earnings page', () => {
  it('loads fulfilled orders and shows each summary period', async () => {
    render(<AdminClientContext.Provider value={client as never}><AdminEarningsPage /></AdminClientContext.Provider>)

    expect(await screen.findByRole('heading', { name: 'الأرباح' })).toBeInTheDocument()
    expect(await screen.findByText('لا تشمل مصاريف التوصيل.')).toBeInTheDocument()
    expect(client.from).toHaveBeenCalledWith('orders')
    expect(query.eq).toHaveBeenCalledWith('status', 'fulfilled')
    expect(query.gte).toHaveBeenCalledWith('created_at', expect.any(String))
    expect(screen.getByRole('heading', { name: 'اليوم' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'هذا الأسبوع' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'هذا الشهر' })).toBeInTheDocument()
  })
})
