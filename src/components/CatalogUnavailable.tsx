import { shopDefaults } from '../config/shopDefaults'
import { WarningCircle, WhatsappLogo } from '@phosphor-icons/react'
import './CatalogUnavailable.css'

export function CatalogUnavailable() {
  return (
    <div className="container section">
      <section className="empty-state catalog-unavailable" aria-labelledby="catalog-unavailable-title">
        <div className="empty-icon" aria-hidden="true"><WarningCircle weight="duotone" /></div>
        <h1 id="catalog-unavailable-title">يمكننا مساعدتك في طلب منتجاتك</h1>
        <p>التسوق الإلكتروني غير متاح مؤقتًا. تواصل معنا عبر واتساب.</p>
        <a className="btn btn-primary" href={`https://wa.me/${shopDefaults.whatsapp_number}`}>
          <WhatsappLogo aria-hidden="true" />
          تواصل معنا على واتساب
        </a>
      </section>
    </div>
  )
}
