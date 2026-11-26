import { ClipboardText, SignOut, Spinner } from '@phosphor-icons/react'
import { Link, Outlet } from '@tanstack/react-router'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { AdminClientContext } from './AdminClientContext'
import './AdminLayout.css'
import './AdminPage.css'

type AdminSession = Awaited<ReturnType<SupabaseClient['auth']['getSession']>>['data']['session']

const adminTabs = [
  { label: 'الطلبات', to: '/admin' },
  { label: 'الأرباح', to: '/admin/earnings' },
  { label: 'المنتجات', to: '/admin/products' },
  { label: 'الإعدادات', to: '/admin/settings' },
] as const

export default function AdminLayout({ supabaseUrl, anonKey }: { supabaseUrl: string | null; anonKey: string | null }) {
  const client = useMemo(() => {
    if (!supabaseUrl || !anonKey) return null
    return createClient(supabaseUrl, anonKey, { auth: { persistSession: true, autoRefreshToken: true } })
  }, [anonKey, supabaseUrl])
  const [session, setSession] = useState<AdminSession | undefined>(() => client ? undefined : null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!client) return
    let isActive = true
    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      if (isActive) setSession(nextSession)
    })
    void client.auth.getSession().then(({ data, error }) => {
      if (!isActive) return
      if (error) setAuthError('تعذر التحقق من الجلسة. حدّث الصفحة وحاول مجددًا.')
      setSession(data.session)
    })
    return () => {
      isActive = false
      subscription.unsubscribe()
    }
  }, [client])

  async function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!client) {
      setAuthError('إعدادات الدخول غير متاحة. تواصل مع مسؤول الموقع.')
      return
    }
    setBusy(true)
    setAuthError('')
    const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password })
    setBusy(false)
    if (error) {
      setAuthError('تعذر تسجيل الدخول. راجع البريد وكلمة المرور وحاول مجددًا.')
      return
    }
    setSession(data.session)
    setPassword('')
  }

  async function logout() {
    if (!client || busy) return
    setBusy(true)
    const { error } = await client.auth.signOut()
    setBusy(false)
    if (error) setAuthError('تعذر تسجيل الخروج. حاول مجددًا.')
    else setSession(null)
  }

  if (session === undefined) {
    return <main className="admin-shell" dir="rtl"><p className="admin-loading"><Spinner size={20} className="admin-spin" /> جارٍ التحقق من الجلسة…</p></main>
  }

  if (!session) {
    return (
      <main className="admin-shell" dir="rtl">
        <section className="admin-login" aria-labelledby="admin-login-title">
          <span className="admin-brand-mark" aria-hidden="true"><ClipboardText size={23} weight="duotone" /></span>
          <h1 id="admin-login-title">دخول المالك</h1>
          <p>سجّل الدخول لمتابعة طلبات المتجر.</p>
          <form onSubmit={submitLogin}>
            <label htmlFor="admin-email">البريد الإلكتروني</label>
            <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} />
            <label htmlFor="admin-password">كلمة المرور</label>
            <input id="admin-password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} />
            {authError && <p className="admin-error" role="alert">{authError}</p>}
            <button className="admin-primary-button" type="submit" disabled={busy || !client}>
              {busy ? 'جارٍ الدخول…' : 'دخول'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <AdminClientContext.Provider value={client}>
      <div className="admin-layout" dir="rtl">
        <header className="admin-layout-header">
          <div className="admin-layout-bar">
            <nav className="admin-tabs" aria-label="أقسام الإدارة">
              {adminTabs.map(({ label, to }) => (
                <Link key={to} to={to} activeOptions={{ exact: true }} activeProps={{ 'aria-current': 'page' }}>
                  {label}
                </Link>
              ))}
            </nav>
            <button className="admin-logout-button" type="button" onClick={logout} disabled={busy} aria-label="تسجيل الخروج">
              <SignOut size={19} /><span>تسجيل الخروج</span>
            </button>
          </div>
        </header>
        {authError && <p className="admin-layout-error" role="alert">{authError}</p>}
        <Outlet />
      </div>
    </AdminClientContext.Provider>
  )
}
