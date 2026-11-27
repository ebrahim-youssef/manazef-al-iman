import { Paper } from '@mantine/core'
import styles from './AdminArea.module.css'
import { useEffect, useState } from 'react'
import { useAdminClient } from './AdminClientContext'
import type { EarningsSummary } from './adminEarnings'
import { formatOrderTotal } from './adminOrders'

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
    void client.rpc('earnings_summary')
      .then(({ data, error: queryError }) => {
        if (!isActive) return
        setIsLoading(false)
        if (queryError) {
          setError('تعذر تحميل الأرباح. تحقق من الاتصال ثم حاول مجددًا.')
          return
        }
        setError('')
        setSummary(data as EarningsSummary)
      })
    return () => { isActive = false }
  }, [client])

  return (
    <main className={styles['admin-shell']} dir="rtl">
      <div className={styles['admin-page']}>
        <header className={styles['admin-header']}><div className={styles['admin-header-copy']}><h1>الأرباح</h1><p>إجماليات الطلبات المسلّمة</p></div></header>
        {isLoading && <p className={styles['admin-loading']}>جارٍ تحميل الأرباح…</p>}
        {error && <p className={styles['admin-error']} role="alert">{error}</p>}
        {!isLoading && !error && (
          <>
            <ul className={styles['admin-earnings-list']}>
              {periods.map(({ key, label }) => (
                <Paper component="li" className={styles['admin-earnings-card']} key={key}>
                  <div><h2>{label}</h2><p>الطلبات: {new Intl.NumberFormat('ar-EG').format(summary[key].orderCount)}</p></div>
                  <strong className={styles['admin-earnings-total']}>{formatOrderTotal(summary[key].totalEgp)}</strong>
                </Paper>
              ))}
            </ul>
            <p className={styles['admin-earnings-note']}>لا تشمل مصاريف التوصيل.</p>
          </>
        )}
      </div>
    </main>
  )
}
