export type OrderStatus = 'new' | 'fulfilled' | 'cancelled'

export type AdminOrder = {
  id: string
  code: string
  status: OrderStatus
  total_egp: number
  item_count: number
  created_at: string
}

export type AdminOrderItem = {
  id: string
  product_name: string
  unit: string
  unit_price_egp: number
  quantity: number
  line_total_egp: number
}

export type OrderFilter = OrderStatus | 'all'

export function filterOrders(orders: AdminOrder[], status: OrderFilter, search: string) {
  const normalizedSearch = search.trim().toLocaleUpperCase('en')
  return [...orders]
    .filter((order) => status === 'all' || order.status === status)
    .filter((order) => order.code.toUpperCase().includes(normalizedSearch))
    .sort((left, right) => Date.parse(right.created_at) - Date.parse(left.created_at))
}

export function formatOrderDate(date: string) {
  return new Intl.DateTimeFormat('ar-EG', {
    calendar: 'gregory',
    day: 'numeric',
    month: 'short',
    timeZone: 'Africa/Cairo',
  }).format(new Date(date))
}

export function formatOrderTotal(total: number) {
  return `${new Intl.NumberFormat('ar-EG').format(total)} ج.م`
}
