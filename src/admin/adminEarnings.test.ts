import { describe, expect, it } from 'vitest'
import { summarizeEarnings } from './adminEarnings'

const today = '2026-11-26T10:00:00.000Z'

function order(id: string, createdAt: string, totalEgp: number, status: 'new' | 'fulfilled' | 'cancelled' = 'fulfilled') {
  return { id, created_at: createdAt, total_egp: totalEgp, status }
}

describe('summarizeEarnings', () => {
  it('groups fulfilled orders by their Cairo order date across midnight', () => {
    const orders = [
      order('before', '2026-11-25T21:59:00.000Z', 10),
      order('after', '2026-11-25T22:01:00.000Z', 20),
      order('new', '2026-11-25T22:02:00.000Z', 30, 'new'),
      order('future', '2026-11-26T22:05:00.000Z', 40),
    ]

    expect(summarizeEarnings(orders, new Date(today))).toEqual({
      today: { totalEgp: 20, orderCount: 1 },
      week: { totalEgp: 30, orderCount: 2 },
      month: { totalEgp: 30, orderCount: 2 },
    })
  })

  it('starts the week on Saturday in Cairo', () => {
    const orders = [
      order('friday', '2026-11-27T12:00:00.000Z', 10),
      order('saturday', '2026-11-28T12:00:00.000Z', 20),
    ]

    expect(summarizeEarnings(orders, new Date('2026-11-28T12:00:00.000Z')).week)
      .toEqual({ totalEgp: 20, orderCount: 1 })
  })

  it('starts the month on its first Cairo calendar day', () => {
    const orders = [
      order('october', '2026-10-31T21:59:00.000Z', 10),
      order('november', '2026-10-31T22:01:00.000Z', 20),
    ]

    expect(summarizeEarnings(orders, new Date(today)).month)
      .toEqual({ totalEgp: 20, orderCount: 1 })
  })

  it('groups both occurrences of the Cairo DST fall-back hour on the same order date', () => {
    const orders = [
      order('first', '2026-10-29T20:59:00.000Z', 10),
      order('second', '2026-10-29T21:00:00.000Z', 20),
    ]

    expect(summarizeEarnings(orders, new Date('2026-10-29T21:30:00.000Z')))
      .toEqual({
        today: { totalEgp: 30, orderCount: 2 },
        week: { totalEgp: 30, orderCount: 2 },
        month: { totalEgp: 30, orderCount: 2 },
      })
  })
})
