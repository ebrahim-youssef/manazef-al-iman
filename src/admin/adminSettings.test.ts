import { describe, expect, it } from 'vitest'
import { validateShopSettings } from './adminSettings'

const validSettings = {
  shop_name: 'متجرنا',
  whatsapp_number: '010 1234 5678',
  phone_number: '',
  address: '',
  map_lat: '30.1',
  map_lng: '31.2',
  opening_hours_text: '',
  facebook_url: 'https://facebook.com/shop',
  instagram_url: '',
  tiktok_url: '',
  delivery_areas: ['مدينة نصر'],
}

describe('shop settings validation', () => {
  it('asks the owner to add at least one delivery area', () => {
    expect(validateShopSettings({ ...validSettings, delivery_areas: [] })).toMatchObject({
      valid: false,
      errors: { delivery_areas: expect.stringContaining('أضف منطقة') },
    })
  })

  it('normalizes local and Arabic-Indic Egyptian mobile numbers', () => {
    expect(validateShopSettings({ ...validSettings, whatsapp_number: '٠١٠ ١٢٣٤ ٥٦٧٨' })).toMatchObject({
      valid: true,
      values: { whatsapp_number: '201012345678' },
    })
    expect(validateShopSettings({ ...validSettings, whatsapp_number: '+20 10 1234 5678' })).toMatchObject({
      valid: true,
      values: { whatsapp_number: '201012345678' },
    })
  })

  it('asks for a supported Egyptian mobile number when the number is invalid', () => {
    expect(validateShopSettings({ ...validSettings, whatsapp_number: '201312345678' })).toMatchObject({
      valid: false,
      errors: { whatsapp_number: expect.stringContaining('أدخل رقمًا مصريًا') },
    })
  })

  it('requires both coordinates together and within map ranges', () => {
    expect(validateShopSettings({ ...validSettings, map_lng: '' })).toMatchObject({
      valid: false,
      errors: { map_lat: expect.any(String), map_lng: expect.any(String) },
    })
    expect(validateShopSettings({ ...validSettings, map_lat: '91' })).toMatchObject({
      valid: false,
      errors: { map_lat: expect.any(String) },
    })
  })

  it('requires links to use https and asks to fix duplicate or blank delivery areas', () => {
    expect(validateShopSettings({ ...validSettings, facebook_url: 'http://facebook.com/shop', delivery_areas: ['وسط البلد', ' وسط البلد ', '  '] })).toMatchObject({
      valid: false,
      errors: {
        facebook_url: expect.stringContaining('https://'),
        delivery_areas: expect.stringContaining('احذف'),
      },
    })
  })

  it('rejects an https prefix without a valid host', () => {
    expect(validateShopSettings({ ...validSettings, facebook_url: 'https://' })).toMatchObject({
      valid: false,
      errors: { facebook_url: expect.any(String) },
    })
  })

  it('trims delivery area names before saving', () => {
    expect(validateShopSettings({ ...validSettings, delivery_areas: [' مدينة نصر '] })).toMatchObject({
      valid: true,
      values: { delivery_areas: ['مدينة نصر'] },
    })
  })
})
