import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { mergeShopSettings } from '../config/shopDefaults'
import VisitUs from './VisitUs'
import { getMapEmbedUrl, getMapSearchUrl, getWhatsAppUrl } from '../utils/visitUsUrls'

afterEach(cleanup)

describe('visit us section', () => {
  it('shows the configured location, address, hours, and contact actions', () => {
    render(<VisitUs settings={mergeShopSettings({
      address: 'شارع النيل، القاهرة',
      map_lat: 30.0444,
      map_lng: 31.2357,
      opening_hours_text: 'من ٩ صباحًا حتى ١٠ مساءً',
      whatsapp_number: '201012345678',
    })} />)

    expect(screen.getByRole('heading', { name: 'زورنا' })).toBeInTheDocument()
    expect(screen.getByText('شارع النيل، القاهرة')).toBeInTheDocument()
    expect(screen.getByText('من ٩ صباحًا حتى ١٠ مساءً')).toBeInTheDocument()
    expect(screen.getByTitle('خريطة موقع منظفات الإيمان')).toHaveAttribute(
      'src',
      'https://www.google.com/maps?q=30.0444,31.2357&output=embed',
    )
    expect(screen.getByRole('link', { name: 'افتح في الخرائط' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=30.0444%2C31.2357',
    )
    expect(screen.getByRole('link', { name: 'افتح في الخرائط' })).toHaveAttribute('rel', 'noopener noreferrer')
    expect(screen.getByRole('link', { name: 'تواصل معنا على واتساب' })).toHaveAttribute('href', 'https://wa.me/201012345678')
  })

  it('uses the address when either map coordinate is missing', () => {
    render(<VisitUs settings={{ ...mergeShopSettings({ address: 'شارع 26 يوليو، القاهرة', map_lat: 30.04 }), map_lng: null }} />)

    expect(screen.getByTitle('خريطة موقع منظفات الإيمان')).toHaveAttribute(
      'src',
      'https://www.google.com/maps?q=%D8%B4%D8%A7%D8%B1%D8%B9%2026%20%D9%8A%D9%88%D9%84%D9%8A%D9%88%D8%8C%20%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9&output=embed',
    )
    expect(screen.getByRole('link', { name: 'افتح في الخرائط' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=%D8%B4%D8%A7%D8%B1%D8%B9%2026%20%D9%8A%D9%88%D9%84%D9%8A%D9%88%D8%8C%20%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9',
    )
  })
})

describe('visit us URLs', () => {
  it('encodes address text and preserves the configured WhatsApp number', () => {
    expect(getMapEmbedUrl(null, null, 'شارع 26 يوليو، القاهرة')).toBe(
      'https://www.google.com/maps?q=%D8%B4%D8%A7%D8%B1%D8%B9%2026%20%D9%8A%D9%88%D9%84%D9%8A%D9%88%D8%8C%20%D8%A7%D9%84%D9%82%D8%A7%D9%87%D8%B1%D8%A9&output=embed',
    )
    expect(getMapSearchUrl(null, null, 'شارع 26 يوليو، القاهرة')).toContain('query=%D8%B4%D8%A7%D8%B1%D8%B9%2026%20')
    expect(getWhatsAppUrl('201012345678')).toBe('https://wa.me/201012345678')
  })
})
