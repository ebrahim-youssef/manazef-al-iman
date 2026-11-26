import { useEffect, useState } from 'react'
import { useAdminClient } from './AdminClientContext'
import { summarizeEarnings, type EarningsSummary } from './adminEarnings'
import { formatOrderTotal } from './adminOrders'

type EarningsRow = {
  created_at: string
  total_egp: number
  status: 'new' | 'fulfilled' | 'cancelled'
}

const emptySummary: EarningsSummary = {
  today: { totalEgp: 0, orderCount: 0 },
  week: { totalEgp: 0, orderCount: 0 },
  month: { totalEgp: 0, orderCount: 0 },
}

const periods = [
  { key: 'today', label: 'اليوم' },
  { key: 'week', label: 'هذا الأسبوع' },
  { key: 'month', label: 'هذا الشهر' },
] as const

export default function AdminEarningsPage() {
  const client = useAdminClient()
  const [summary, setSummary] = useState(emptySummary)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isActive = true
    const earliestCreatedAt = new Date(Date.now() - 33 * 24 * 60 * 60 * 1000).toISOString()
    void client.from('orders')
      .select('created_at, total_egp, status')
      .eq('status', 'fulfilled')
      .gte('created_at', earliestCreatedAt)
      .then(({ data, error: queryError }) => {
        if (!isActive) return
        setIsLoading(false)
        if (queryError) {
          setError('تعذر تحميل الأرباح. تحقق من الاتصال ثم حاول مجددًا.')
          return
        }
        setError('')
        setSummary(summarizeEarnings((data ?? []) as EarningsRow[], new Date()))
      })
    return () => { isActive = false }
  }, [client])

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-page">
        <header className="admin-header"><div className="admin-header-copy"><h1>الأرباح</h1><p>إجماليات الطلبات المسلّمة</p></div></header>
        {isLoading && <p className="admin-loading">جارٍ تحميل الأرباح…</p>}
        {error && <p className="admin-error" role="alert">{error}</p>}
        {!isLoading && !error && (
          <>
            <ul className="admin-earnings-list">
              {periods.map(({ key, label }) => (
                <li className="admin-earnings-card" key={key}>
                  <div><h2>{label}</h2><p>{new Intl.NumberFormat('ar-EG').format(summary[key].orderCount)} طلب</p></div>
                  <strong className="admin-earnings-total">{formatOrderTotal(summary[key].totalEgp)}</strong>
                </li>
              ))}
            </ul>
            <p className="admin-earnings-note">لا تشمل مصاريف التوصيل.</p>
          </>
        )}
      </div>
    </main>
  )
}
