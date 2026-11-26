import { describe, expect, it } from 'vitest'
import { formatEgyptianMobile, mergeShopSettings, shopDefaults } from './shopDefaults'

describe('shop settings defaults', () => {
  it('formats a WhatsApp number in local form', () => {
    expect(formatEgyptianMobile('201012345678')).toBe('01012345678')
  })

  it('uses defaults when the settings row is missing', () => {
    expect(mergeShopSettings(null)).toEqual(shopDefaults)
    expect(shopDefaults).toMatchObject({ map_lat: 30.0444, map_lng: 31.2357 })
  })

  it('fills missing fields when the settings row is partial', () => {
    expect(mergeShopSettings({ shop_name: 'متجرنا' })).toEqual({ ...shopDefaults, shop_name: 'متجرنا' })
  })

  it('uses defaults when stored text fields are empty', () => {
    expect(mergeShopSettings({ shop_name: '', whatsapp_number: '', address: '' })).toMatchObject({
      shop_name: shopDefaults.shop_name,
      whatsapp_number: shopDefaults.whatsapp_number,
      address: shopDefaults.address,
    })
  })
})
