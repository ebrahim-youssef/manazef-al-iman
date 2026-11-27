import { Button, TextInput, UnstyledButton } from '@mantine/core'
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
import styles from './AdminArea.module.css'

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
    <main className={styles['admin-shell']} dir="rtl">
      <div className={styles['admin-page']}>
        <header className={styles['admin-header']}>
          {selectedOrder ? (
            <UnstyledButton className={styles['admin-back-button']} type="button" onClick={() => { selectedOrderId.current = null; setSelectedOrder(null); setItems(null) }} aria-label="العودة إلى الطلبات">
              <ArrowRight size={20} />
            </UnstyledButton>
          ) : <span className={styles['admin-brand-mark']} aria-hidden="true"><ClipboardText size={22} weight="duotone" /></span>}
          <div className={styles['admin-header-copy']}>
            <h1>{selectedOrder ? `طلب ${selectedOrder.code}` : 'الطلبات'}</h1>
            <p>{selectedOrder ? formatOrderDate(selectedOrder.created_at) : 'متابعة طلبات المتجر'}</p>
          </div>
        </header>

        {selectedOrder ? (
          <section className={styles['admin-detail']} aria-label={`تفاصيل الطلب ${selectedOrder.code}`}>
            <div className={styles['admin-detail-summary']}>
              <div><span>حالة الطلب</span><strong className={`${styles['admin-status']} ${styles[`admin-status-${selectedOrder.status}`]}`}>{statusNames[selectedOrder.status]}</strong></div>
              <div><span>عدد القطع</span><strong>{new Intl.NumberFormat('ar-EG').format(selectedOrder.item_count)}</strong></div>
              <div><span>الإجمالي</span><strong>{formatOrderTotal(selectedOrder.total_egp)}</strong></div>
            </div>
            <h2>المنتجات</h2>
            {items === null && !detailError && <p className={styles['admin-loading']}><Spinner size={18} className={styles['admin-spin']} /> جارٍ تحميل المنتجات…</p>}
            {detailError && <p className={styles['admin-error']} role="alert">{detailError}</p>}
            {items && items.length === 0 && <p className={styles['admin-empty']}>لا توجد منتجات مسجلة في هذا الطلب.</p>}
            {items && items.length > 0 && (
              <ul className={styles['admin-item-list']}>
                {items.map((item) => (
                  <li key={item.id}>
                    <div><strong>{item.product_name}</strong><span>{item.quantity} × {formatOrderTotal(item.unit_price_egp)}{item.unit ? ` · ${item.unit}` : ''}</span></div>
                    <b>{formatOrderTotal(item.line_total_egp)}</b>
                  </li>
                ))}
              </ul>
            )}
            <div className={styles['admin-status-actions']} aria-label="تغيير حالة الطلب">
              {selectedOrder.status !== 'fulfilled' && <Button type="button" className={styles['admin-primary-button']} onClick={() => changeStatus('fulfilled')} disabled={changingStatus}>تم التسليم</Button>}
              {selectedOrder.status !== 'cancelled' && <Button type="button" className={styles['admin-danger-button']} onClick={() => changeStatus('cancelled')} disabled={changingStatus}>إلغاء الطلب</Button>}
              {selectedOrder.status !== 'new' && <Button type="button" className={styles['admin-secondary-button']} onClick={() => changeStatus('new')} disabled={changingStatus}>إعادة إلى جديد</Button>}
            </div>
          </section>
        ) : (
          <>
            <section className={styles['admin-controls']} aria-label="البحث والتصفية">
              <UnstyledButton className={styles['admin-refresh-button']} type="button" onClick={refreshOrders} disabled={isRefreshing}>
                {isRefreshing ? <Spinner size={18} className={styles['admin-spin']} aria-hidden="true" /> : <ArrowClockwise size={18} aria-hidden="true" />}
                {isRefreshing ? 'جارٍ تحديث الطلبات…' : 'تحديث الطلبات'}
              </UnstyledButton>
              <TextInput aria-label="البحث برقم الطلب" leftSection={<MagnifyingGlass size={19} aria-hidden="true" />} value={search} onChange={(event) => setSearch(event.currentTarget.value)} placeholder="ابحث برقم الطلب" />
              <div className={styles['admin-filter-list']} role="group" aria-label="تصفية حسب الحالة">
                {(['all', 'new', 'fulfilled', 'cancelled'] as const).map((filter) => (
                  <UnstyledButton key={filter} type="button" className={statusFilter === filter ? styles['is-selected'] : ''} onClick={() => setStatusFilter(filter)} aria-pressed={statusFilter === filter}>
                    {filter === 'all' ? 'الكل' : statusNames[filter]}
                  </UnstyledButton>
                ))}
              </div>
            </section>
            {ordersError && <p className={styles['admin-error']} role="alert">{ordersError}</p>}
            {!ordersError && visibleOrders.length === 0 && <p className={styles['admin-empty']}>{orders.length ? 'لا توجد طلبات تطابق البحث.' : 'لا توجد طلبات حتى الآن.'}</p>}
            {visibleOrders.length > 0 && (
              <ul className={styles['admin-order-list']}>
                {visibleOrders.map((order) => (
                  <li key={order.id}>
                    <UnstyledButton type="button" className={styles['admin-order-row']} onClick={() => openOrder(order)}>
                      <span className={styles['admin-order-code']}>{order.code}</span>
                      <span className={`${styles['admin-status']} ${styles[`admin-status-${order.status}`]}`}>{statusNames[order.status]}</span>
                      <span className={styles['admin-order-date']}>{formatOrderDate(order.created_at)}</span>
                      <span className={styles['admin-order-count']}>{new Intl.NumberFormat('ar-EG').format(order.item_count)} قطع</span>
                      <strong className={styles['admin-order-total']}>{formatOrderTotal(order.total_egp)}</strong>
                      <ArrowUpLeft className={styles['admin-order-arrow']} size={17} aria-hidden="true" />
                    </UnstyledButton>
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
