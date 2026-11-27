import { Box } from '@mantine/core';
import { useLoaderData } from '@tanstack/react-router'
import { WarningCircle, WhatsappLogo } from '@phosphor-icons/react'
import styles from './CatalogUnavailable.module.css'

export function CatalogUnavailable() {
  const settings = useLoaderData({ from: '__root__' })
  return (
    <Box className="container section">
      <section className={'empty-state' + ' ' + styles['catalog-unavailable']} aria-labelledby="catalog-unavailable-title">
        <Box className="empty-icon" aria-hidden="true"><WarningCircle weight="duotone" /></Box>
        <h1 id="catalog-unavailable-title">يمكننا مساعدتك في طلب منتجاتك</h1>
        <p>التسوق الإلكتروني غير متاح مؤقتًا. تواصل معنا عبر واتساب.</p>
        <a className="btn btn-primary" href={`https://wa.me/${settings.whatsapp_number}`}>
          <WhatsappLogo aria-hidden="true" />
          تواصل معنا على واتساب
        </a>
      </section>
    </Box>
  )
}
