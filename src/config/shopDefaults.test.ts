import { describe, expect, it } from 'vitest'
import { mergeShopSettings, shopDefaults } from './shopDefaults'

describe('shop settings defaults', () => {
  it('uses defaults when the settings row is missing', () => {
    expect(mergeShopSettings(null)).toEqual(shopDefaults)
    expect(shopDefaults).toMatchObject({ map_lat: 30.0444, map_lng: 31.2357 })
  })

  it('fills missing fields when the settings row is partial', () => {
    expect(mergeShopSettings({ shop_name: 'متجرنا' })).toEqual({ ...shopDefaults, shop_name: 'متجرنا' })
  })
})
