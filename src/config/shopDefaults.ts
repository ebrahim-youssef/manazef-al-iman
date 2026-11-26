export const shopDefaults = {
  shop_name: 'منظفات الإيمان',
  whatsapp_number: '201097961866',
  phone_number: '0109 796 1866',
  address: 'القاهرة، مصر (عنوان تجريبي)',
  map_lat: 30.0444 as number | null, // Placeholder coordinate in central Cairo until the shop location is configured.
  map_lng: 31.2357 as number | null,
  opening_hours_text: 'يوميًا 9 ص - 10 م',
  facebook_url: 'https://www.facebook.com/share/1FUbavfPhu/',
  instagram_url: 'https://www.instagram.com/zoghlyahmed',
  tiktok_url: 'https://www.tiktok.com/@user15552825',
  delivery_areas: [],
}

export function mergeShopSettings(settings: Partial<typeof shopDefaults> | null | undefined) {
  return { ...shopDefaults, ...settings }
}
