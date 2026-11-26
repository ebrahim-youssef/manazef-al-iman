import { describe, expect, it } from 'vitest'
import { filterOrders, formatOrderDate, formatOrderTotal, type AdminOrder } from './adminOrders'

const orders: AdminOrder[] = [
  { id: '1', code: 'AB23CD', status: 'new', total_egp: 250, item_count: 3, created_at: '2026-11-25T21:30:00.000Z' },
  { id: '2', code: 'XY78KL', status: 'fulfilled', total_egp: 1100, item_count: 1, created_at: '2026-11-24T12:00:00.000Z' },
  { id: '3', code: 'PQ45RS', status: 'cancelled', total_egp: 75, item_count: 2, created_at: '2026-11-23T12:00:00.000Z' },
]

describe('admin order list', () => {
  it('sorts newest first and filters by status and code', () => {
    expect(filterOrders(orders, 'all', '').map(({ id }) => id)).toEqual(['1', '2', '3'])
    expect(filterOrders(orders, 'fulfilled', '').map(({ code }) => code)).toEqual(['XY78KL'])
    expect(filterOrders(orders, 'all', 'pq45').map(({ id }) => id)).toEqual(['3'])
    expect(filterOrders(orders, 'new', 'xy').map(({ id }) => id)).toEqual([])
  })

  it('formats order dates in Cairo and totals in Egyptian pounds', () => {
    expect(formatOrderDate('2026-11-25T22:30:00.000Z')).toBe('٢٦ نوفمبر، ١٢:٣٠ ص')
    expect(formatOrderTotal(1100)).toContain('١٬١٠٠')
  })
})
