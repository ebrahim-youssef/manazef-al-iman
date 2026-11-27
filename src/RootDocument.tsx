import { HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { ColorSchemeScript, DirectionProvider, MantineProvider, mantineHtmlProps } from '@mantine/core'
import '@mantine/core/styles.layer.css'
import { theme } from './theme'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import VisitUs from './components/VisitUs'
import type { getShopSettings } from './data/settings'
import shell from './App.module.css'
import adminFrame from './AdminFrame.module.css'
import './index.css'

export default function RootDocument({ settings, isAdmin }: { settings: Awaited<ReturnType<typeof getShopSettings>>; isAdmin: boolean }) {
  return (
    <html {...mantineHtmlProps} lang="ar" dir="rtl">
      <head>
        <ColorSchemeScript forceColorScheme="light" />
        <HeadContent />
        <title>{`${settings.shop_name} | ${isAdmin ? 'لوحة المالك' : 'كل احتياجات بيتك في مكان واحد'}`}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <MantineProvider theme={theme} forceColorScheme="light">
          <DirectionProvider initialDirection="rtl">
        {isAdmin ? (
          <div className={adminFrame['admin-app-shell']}>
            <header className={adminFrame['admin-app-header']}>
              <div><strong>{settings.shop_name}</strong><span>لوحة المالك</span></div>
            </header>
            <Outlet />
          </div>
        ) : (
          <CartProvider>
            <div className={shell['app-shell']}>
              <ScrollToTop />
              <Header />
              <main className={shell['main-content']}><Outlet /></main>
              <VisitUs settings={settings} />
              <Footer />
            </div>
          </CartProvider>
        )}
          </DirectionProvider>
        </MantineProvider>
        <Scripts />
      </body>
    </html>
  )
}
