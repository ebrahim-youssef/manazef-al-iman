import { Box } from '@mantine/core';
import { Clock, MapPin, WhatsappLogo } from '@phosphor-icons/react'
import type { mergeShopSettings } from '../config/shopDefaults'
import { getMapEmbedUrl, getMapSearchUrl, getWhatsAppUrl } from '../utils/visitUsUrls'
import styles from './VisitUs.module.css'

type ShopSettings = ReturnType<typeof mergeShopSettings>

export default function VisitUs({ settings }: { settings: ShopSettings }) {
  return (
    <section className="visit-section section" aria-labelledby="visit-title">
      <Box className="container">
        <Box className="section-header">
          <h2 className="section-title" id="visit-title">زورنا</h2>
        </Box>
        <Box className={styles['visit-layout']}>
          <Box className={styles['visit-map']}>
            <iframe
              src={getMapEmbedUrl(settings.map_lat, settings.map_lng, settings.address)}
              title="خريطة موقع منظفات الإيمان"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </Box>
          <Box className={styles['visit-details']}>
            <Box className={styles['visit-detail']}>
              <MapPin aria-hidden="true" />
              <Box>
                <h3>العنوان</h3>
                <p>{settings.address}</p>
              </Box>
            </Box>
            <Box className={styles['visit-detail']}>
              <Clock aria-hidden="true" />
              <Box>
                <h3>ساعات العمل</h3>
                <p>{settings.opening_hours_text}</p>
              </Box>
            </Box>
            <Box className={styles['visit-actions']}>
              <a className="btn btn-outline" href={getMapSearchUrl(settings.map_lat, settings.map_lng, settings.address)} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                افتح في الخرائط
              </a>
              <a className="btn btn-primary" href={getWhatsAppUrl(settings.whatsapp_number)}>
                <WhatsappLogo aria-hidden="true" />
                تواصل معنا على واتساب
              </a>
            </Box>
          </Box>
        </Box>
      </Box>
    </section>
  )
}
