import styles from './AdminArea.module.css'
export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <main className={styles['admin-shell']} dir="rtl">
      <div className={styles['admin-page']}>
        <header className={styles['admin-header']}><div className={styles['admin-header-copy']}><h1>{title}</h1></div></header>
        <p className={styles['admin-placeholder']}>هذا القسم قادم قريبًا.</p>
      </div>
    </main>
  )
}
