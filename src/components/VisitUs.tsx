import { Clock, MapPin, WhatsappLogo } from '@phosphor-icons/react'
import type { mergeShopSettings } from '../config/shopDefaults'
import { getMapEmbedUrl, getMapSearchUrl, getWhatsAppUrl } from '../utils/visitUsUrls'
import './VisitUs.css'

type ShopSettings = ReturnType<typeof mergeShopSettings>

export default function VisitUs({ settings }: { settings: ShopSettings }) {
  return (
    <section className="visit-section section" aria-labelledby="visit-title">
      <div className="container">
        <div className="section-header">
          <h2 className="section-title" id="visit-title">زورنا</h2>
        </div>
        <div className="visit-layout">
          <div className="visit-map">
            <iframe
              src={getMapEmbedUrl(settings.map_lat, settings.map_lng, settings.address)}
              title="خريطة موقع منظفات الإيمان"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="visit-details">
            <div className="visit-detail">
              <MapPin aria-hidden="true" />
              <div>
                <h3>العنوان</h3>
                <p>{settings.address}</p>
              </div>
            </div>
            <div className="visit-detail">
              <Clock aria-hidden="true" />
              <div>
                <h3>ساعات العمل</h3>
                <p>{settings.opening_hours_text}</p>
              </div>
            </div>
            <div className="visit-actions">
              <a className="btn btn-outline" href={getMapSearchUrl(settings.map_lat, settings.map_lng, settings.address)} target="_blank" rel="noopener noreferrer">
                <MapPin aria-hidden="true" />
                افتح في الخرائط
              </a>
              <a className="btn btn-primary" href={getWhatsAppUrl(settings.whatsapp_number)}>
                <WhatsappLogo aria-hidden="true" />
                تواصل معنا على واتساب
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
