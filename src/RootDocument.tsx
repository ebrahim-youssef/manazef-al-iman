import { HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import VisitUs from './components/VisitUs'
import type { getShopSettings } from './data/settings'
import './App.css'
import './AdminFrame.css'
import './index.css'

export default function RootDocument({ settings, isAdmin }: { settings: Awaited<ReturnType<typeof getShopSettings>>; isAdmin: boolean }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        <title>{settings.shop_name} | {isAdmin ? 'لوحة المالك' : 'كل احتياجات بيتك في مكان واحد'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        {isAdmin ? (
          <div className="admin-app-shell">
            <header className="admin-app-header">
              <div><strong>{settings.shop_name}</strong><span>لوحة المالك</span></div>
            </header>
            <Outlet />
          </div>
        ) : (
          <CartProvider>
            <div className="app-shell">
              <ScrollToTop />
              <Header />
              <main className="main-content"><Outlet /></main>
              <VisitUs settings={settings} />
              <Footer />
            </div>
          </CartProvider>
        )}
        <Scripts />
      </body>
    </html>
  )
}
