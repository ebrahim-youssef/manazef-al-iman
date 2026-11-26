const CAIRO_TIME_ZONE = 'Africa/Cairo'

export type EarningsOrder = {
  created_at: string
  total_egp: number
  status: 'new' | 'fulfilled' | 'cancelled'
}

export type EarningsTotal = {
  totalEgp: number
  orderCount: number
}

export type EarningsSummary = {
  today: EarningsTotal
  week: EarningsTotal
  month: EarningsTotal
}

function getCairoDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en', {
    calendar: 'gregory',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: CAIRO_TIME_ZONE,
  }).formatToParts(date)
  const values = new Map(parts.map(({ type, value }) => [type, value]))
  const year = Number(values.get('year'))
  const month = Number(values.get('month'))
  const day = Number(values.get('day'))
  return { year, month, day, key: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}` }
}

function getSaturdayWeekStart(date: Date) {
  const { year, month, day } = getCairoDateParts(date)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  const daysAfterSaturday = (weekday + 1) % 7
  const weekStart = new Date(Date.UTC(year, month - 1, day - daysAfterSaturday))
  return `${weekStart.getUTCFullYear()}-${String(weekStart.getUTCMonth() + 1).padStart(2, '0')}-${String(weekStart.getUTCDate()).padStart(2, '0')}`
}

export function summarizeEarnings(orders: EarningsOrder[], now: Date): EarningsSummary {
  const today = getCairoDateParts(now)
  const weekStart = getSaturdayWeekStart(now)
  const monthStart = `${today.year}-${String(today.month).padStart(2, '0')}-01`
  const summary: EarningsSummary = {
    today: { totalEgp: 0, orderCount: 0 },
    week: { totalEgp: 0, orderCount: 0 },
    month: { totalEgp: 0, orderCount: 0 },
  }

  for (const order of orders) {
    if (order.status !== 'fulfilled') continue
    const orderDate = getCairoDateParts(new Date(order.created_at)).key
    if (orderDate === today.key) {
      summary.today.totalEgp += order.total_egp
      summary.today.orderCount += 1
    }
    if (orderDate >= weekStart && orderDate <= today.key) {
      summary.week.totalEgp += order.total_egp
      summary.week.orderCount += 1
    }
    if (orderDate >= monthStart && orderDate <= today.key) {
      summary.month.totalEgp += order.total_egp
      summary.month.orderCount += 1
    }
  }

  return summary
}
