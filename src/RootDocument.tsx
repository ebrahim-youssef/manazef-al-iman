import { HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { CartProvider } from './context/CartContext'
import Header from './components/Header'
import Footer from './components/Footer'
import ScrollToTop from './components/ScrollToTop'
import './index.css'

export default function RootDocument() {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <HeadContent />
        <title>منظفات الإيمان | كل احتياجات بيتك في مكان واحد</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <CartProvider>
          <div className="app-shell">
            <ScrollToTop />
            <Header />
            <main className="main-content"><Outlet /></main>
            <Footer />
          </div>
        </CartProvider>
        <Scripts />
      </body>
    </html>
  )
}
