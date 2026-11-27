import shared from '../Storefront.module.css'
import { Box } from '@mantine/core';
import { useLoaderData } from '@tanstack/react-router'
import { WarningCircle, WhatsappLogo } from '@phosphor-icons/react'
import styles from './CatalogUnavailable.module.css'

export function CatalogUnavailable() {
  const settings = useLoaderData({ from: '__root__' })
  return (
    <Box className={[shared['container'], shared['section']].join(' ')}>
      <section className={[shared['empty-state'], styles['catalog-unavailable']].join(' ')} aria-labelledby="catalog-unavailable-title">
        <Box className={shared['empty-icon']} aria-hidden="true"><WarningCircle weight="duotone" /></Box>
        <h1 id="catalog-unavailable-title">يمكننا مساعدتك في طلب منتجاتك</h1>
        <p>التسوق الإلكتروني غير متاح مؤقتًا. تواصل معنا عبر واتساب.</p>
        <a className={[shared['btn'], shared['btn-primary']].join(' ')} href={`https://wa.me/${settings.whatsapp_number}`}>
          <WhatsappLogo aria-hidden="true" />
          تواصل معنا على واتساب
        </a>
      </section>
    </Box>
  )
}
