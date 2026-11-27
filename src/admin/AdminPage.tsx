import { ArrowClockwise, ArrowRight, ArrowUpLeft, ClipboardText, MagnifyingGlass, Spinner } from '@phosphor-icons/react'
import type { SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useRef, useState } from 'react'
import { useAdminClient } from './AdminClientContext'
import {
  filterOrders,
  formatOrderDate,
  formatOrderTotal,
  type AdminOrder,
  type AdminOrderItem,
  type OrderFilter,
  type OrderStatus,
} from './adminOrders'
import './AdminPage.css'

const statusNames: Record<OrderStatus, string> = {
  new: 'جديد',
  fulfilled: 'مكتمل',
  cancelled: 'ملغي',
}

export default function AdminPage() {
  const client = useAdminClient()
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [statusFilter, setStatusFilter] = useState<OrderFilter>('all')
  const [search, setSearch] = useState('')
  const [selectedOrder, setSelectedOrder] = useState<AdminOrder | null>(null)
  const selectedOrderId = useRef<string | null>(null)
  const [items, setItems] = useState<AdminOrderItem[] | null>(null)
  const [detailError, setDetailError] = useState('')
  const [changingStatus, setChangingStatus] = useState(false)

  useEffect(() => {
    let isActive = true
    void loadOrders(client).then(({ data, error }) => {
      if (!isActive) return
      if (error) {
        setOrders([])
        setOrdersError('تعذر تحميل الطلبات. تحقق من الاتصال ثم حاول مجددًا.')
        return
      }
      setOrdersError('')
      setOrders(data ?? [])
    })
    return () => { isActive = false }
  }, [client])

  async function refreshOrders() {
    if (isRefreshing) return
    setIsRefreshing(true)
    const { data, error } = await loadOrders(client)
    setIsRefreshing(false)
    if (error) {
      setOrdersError('تعذر تحميل الطلبات. تحقق من الاتصال ثم حاول مجددًا.')
      return
    }
    setOrdersError('')
    setOrders(data ?? [])
  }

  async function openOrder(order: AdminOrder) {
    if (!client) return
    selectedOrderId.current = order.id
    setSelectedOrder(order)
    setItems(null)
    setDetailError('')
    const { data, error } = await client.from('order_items')
      .select('id, product_name, unit, unit_price_egp, quantity, line_total_egp')
      .eq('order_id', order.id)
      .order('product_name', { ascending: true })
    if (selectedOrderId.current !== order.id) return
    if (error) {
      setDetailError('تعذر تحميل تفاصيل الطلب. حاول فتحه مجددًا.')
      return
    }
    setItems(data ?? [])
  }

  async function changeStatus(status: OrderStatus) {
    if (!client || !selectedOrder || changingStatus) return
    const orderId = selectedOrder.id
    setChangingStatus(true)
    setDetailError('')
    const { error } = await client.rpc('set_order_status', { code: selectedOrder.code, next_status: status })
    setChangingStatus(false)
    if (selectedOrderId.current !== orderId) return
    if (error) {
      setDetailError('تعذر تحديث حالة الطلب. حدّث القائمة وحاول مجددًا.')
      return
    }
    setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order))
    setSelectedOrder((current) => current?.id === orderId ? { ...current, status } : current)
  }

  const visibleOrders = filterOrders(orders, statusFilter, search)

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-page">
        <header className="admin-header">
          {selectedOrder ? (
            <button className="admin-back-button" type="button" onClick={() => { selectedOrderId.current = null; setSelectedOrder(null); setItems(null) }} aria-label="العودة إلى الطلبات">
              <ArrowRight size={20} />
            </button>
          ) : <span className="admin-brand-mark" aria-hidden="true"><ClipboardText size={22} weight="duotone" /></span>}
          <div className="admin-header-copy">
            <h1>{selectedOrder ? `طلب ${selectedOrder.code}` : 'الطلبات'}</h1>
            <p>{selectedOrder ? formatOrderDate(selectedOrder.created_at) : 'متابعة طلبات المتجر'}</p>
          </div>
        </header>

        {selectedOrder ? (
          <section className="admin-detail" aria-label={`تفاصيل الطلب ${selectedOrder.code}`}>
            <div className="admin-detail-summary">
              <div><span>حالة الطلب</span><strong className={`admin-status admin-status-${selectedOrder.status}`}>{statusNames[selectedOrder.status]}</strong></div>
              <div><span>عدد القطع</span><strong>{new Intl.NumberFormat('ar-EG').format(selectedOrder.item_count)}</strong></div>
              <div><span>الإجمالي</span><strong>{formatOrderTotal(selectedOrder.total_egp)}</strong></div>
            </div>
            <h2>المنتجات</h2>
            {items === null && !detailError && <p className="admin-loading"><Spinner size={18} className="admin-spin" /> جارٍ تحميل المنتجات…</p>}
            {detailError && <p className="admin-error" role="alert">{detailError}</p>}
            {items && items.length === 0 && <p className="admin-empty">لا توجد منتجات مسجلة في هذا الطلب.</p>}
            {items && items.length > 0 && (
              <ul className="admin-item-list">
                {items.map((item) => (
                  <li key={item.id}>
                    <div><strong>{item.product_name}</strong><span>{item.quantity} × {formatOrderTotal(item.unit_price_egp)}{item.unit ? ` · ${item.unit}` : ''}</span></div>
                    <b>{formatOrderTotal(item.line_total_egp)}</b>
                  </li>
                ))}
              </ul>
            )}
            <div className="admin-status-actions" aria-label="تغيير حالة الطلب">
              {selectedOrder.status !== 'fulfilled' && <button type="button" className="admin-primary-button" onClick={() => changeStatus('fulfilled')} disabled={changingStatus}>تم التسليم</button>}
              {selectedOrder.status !== 'cancelled' && <button type="button" className="admin-danger-button" onClick={() => changeStatus('cancelled')} disabled={changingStatus}>إلغاء الطلب</button>}
              {selectedOrder.status !== 'new' && <button type="button" className="admin-secondary-button" onClick={() => changeStatus('new')} disabled={changingStatus}>إعادة إلى جديد</button>}
            </div>
          </section>
        ) : (
          <>
            <section className="admin-controls" aria-label="البحث والتصفية">
              <button className="admin-refresh-button" type="button" onClick={refreshOrders} disabled={isRefreshing}>
                {isRefreshing ? <Spinner size={18} className="admin-spin" aria-hidden="true" /> : <ArrowClockwise size={18} aria-hidden="true" />}
                {isRefreshing ? 'جارٍ تحديث الطلبات…' : 'تحديث الطلبات'}
              </button>
              <label className="admin-search">
                <MagnifyingGlass size={19} aria-hidden="true" />
                <span className="admin-visually-hidden">البحث برقم الطلب</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث برقم الطلب" />
              </label>
              <div className="admin-filter-list" role="group" aria-label="تصفية حسب الحالة">
                {(['all', 'new', 'fulfilled', 'cancelled'] as const).map((filter) => (
                  <button key={filter} type="button" className={statusFilter === filter ? 'is-selected' : ''} onClick={() => setStatusFilter(filter)} aria-pressed={statusFilter === filter}>
                    {filter === 'all' ? 'الكل' : statusNames[filter]}
                  </button>
                ))}
              </div>
            </section>
            {ordersError && <p className="admin-error" role="alert">{ordersError}</p>}
            {!ordersError && visibleOrders.length === 0 && <p className="admin-empty">{orders.length ? 'لا توجد طلبات تطابق البحث.' : 'لا توجد طلبات حتى الآن.'}</p>}
            {visibleOrders.length > 0 && (
              <ul className="admin-order-list">
                {visibleOrders.map((order) => (
                  <li key={order.id}>
                    <button type="button" className="admin-order-row" onClick={() => openOrder(order)}>
                      <span className="admin-order-code">{order.code}</span>
                      <span className={`admin-status admin-status-${order.status}`}>{statusNames[order.status]}</span>
                      <span className="admin-order-date">{formatOrderDate(order.created_at)}</span>
                      <span className="admin-order-count">{new Intl.NumberFormat('ar-EG').format(order.item_count)} قطع</span>
                      <strong className="admin-order-total">{formatOrderTotal(order.total_egp)}</strong>
                      <ArrowUpLeft className="admin-order-arrow" size={17} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  )
}

async function loadOrders(client: SupabaseClient) {
  return client.from('orders')
    .select('id, code, status, total_egp, item_count, created_at')
    .order('created_at', { ascending: false }) as unknown as Promise<{ data: AdminOrder[] | null; error: { message: string } | null }>
}
