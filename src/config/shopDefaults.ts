export const shopDefaults = {
  shop_name: 'منظفات الإيمان',
  whatsapp_number: '2010XXXXXXXXX',
  phone_number: '0100 000 0000',
  address: 'القاهرة، مصر (عنوان تجريبي)',
  map_lat: null,
  map_lng: null,
  opening_hours_text: 'يوميًا 9 ص - 10 م',
  facebook_url: 'https://facebook.com',
  instagram_url: 'https://instagram.com',
  delivery_areas: [],
}

export function mergeShopSettings(settings: Partial<typeof shopDefaults> | null | undefined) {
  return { ...shopDefaults, ...settings }
}
