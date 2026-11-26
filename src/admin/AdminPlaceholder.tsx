export default function AdminPlaceholder({ title }: { title: string }) {
  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-page">
        <header className="admin-header"><div className="admin-header-copy"><h1>{title}</h1></div></header>
        <p className="admin-placeholder">هذا القسم قادم قريبًا.</p>
      </div>
    </main>
  )
}
