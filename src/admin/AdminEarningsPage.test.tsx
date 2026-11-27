import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AdminClientContext } from './AdminClientContext'
import AdminEarningsPage from './AdminEarningsPage'

const { client } = vi.hoisted(() => ({
  client: { rpc: vi.fn().mockResolvedValue({ data: {
    today: { totalEgp: 120, orderCount: 1 },
    week: { totalEgp: 120, orderCount: 1 },
    month: { totalEgp: 120, orderCount: 1 },
  }, error: null }) },
}))

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('admin earnings page', () => {
  it('loads fulfilled orders and shows each summary period', async () => {
    render(<AdminClientContext.Provider value={client as never}><AdminEarningsPage /></AdminClientContext.Provider>)

    expect(await screen.findByRole('heading', { name: 'الأرباح' })).toBeInTheDocument()
    expect(await screen.findByText('لا تشمل مصاريف التوصيل.')).toBeInTheDocument()
    expect(client.rpc).toHaveBeenCalledWith('earnings_summary')
    expect(screen.getByRole('heading', { name: 'اليوم' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'هذا الأسبوع' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'هذا الشهر' })).toBeInTheDocument()
  })
})
