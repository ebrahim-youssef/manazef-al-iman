export type ShopSettingsForm = {
  shop_name: string
  whatsapp_number: string
  phone_number: string
  address: string
  map_lat: string
  map_lng: string
  opening_hours_text: string
  facebook_url: string
  instagram_url: string
  tiktok_url: string
  delivery_areas: string[]
}

type ShopSettingsValues = Omit<ShopSettingsForm, 'map_lat' | 'map_lng'> & {
  whatsapp_number: string
  map_lat: number | null
  map_lng: number | null
}

type ValidationResult =
  | { valid: true; values: ShopSettingsValues; errors: Record<string, never> }
  | { valid: false; errors: Partial<Record<keyof ShopSettingsForm, string>> }

const digitMap: Record<string, string> = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
}

function normalizeEgyptianMobile(value: string) {
  const converted = [...value].map((character) => digitMap[character] ?? character).join('')
  const compact = converted.replace(/[\s().-]/g, '')
  const withoutCountryCode = compact.startsWith('+20') ? compact.slice(3) : compact.startsWith('20') ? compact.slice(2) : compact
  const national = withoutCountryCode.startsWith('0') ? withoutCountryCode.slice(1) : withoutCountryCode
  if (!/^1[0125]\d{8}$/.test(national)) return null
  if (!/^\+?\d[\d\s().-]*$/.test(converted.trim())) return null
  return `20${national}`
}

export function validateShopSettings(form: ShopSettingsForm): ValidationResult {
  const errors: Partial<Record<keyof ShopSettingsForm, string>> = {}
  const whatsappNumber = form.whatsapp_number.trim() ? normalizeEgyptianMobile(form.whatsapp_number) : ''
  if (form.whatsapp_number.trim() && !whatsappNumber) {
    errors.whatsapp_number = 'أدخل رقمًا مصريًا يبدأ بـ 010 أو 011 أو 012 أو 015، ثم احفظ الإعدادات.'
  }

  const latitude = form.map_lat.trim() ? Number(form.map_lat) : null
  const longitude = form.map_lng.trim() ? Number(form.map_lng) : null
  if ((latitude === null) !== (longitude === null)) {
    errors.map_lat = 'أدخل خط العرض والطول معًا، أو اتركهما فارغين لاستخدام الموقع الافتراضي.'
    errors.map_lng = errors.map_lat
  } else {
    if (latitude !== null && (!Number.isFinite(latitude) || latitude < -90 || latitude > 90)) {
      errors.map_lat = 'أدخل خط عرض بين -90 و90.'
    }
    if (longitude !== null && (!Number.isFinite(longitude) || longitude < -180 || longitude > 180)) {
      errors.map_lng = 'أدخل خط طول بين -180 و180.'
    }
  }

  for (const key of ['facebook_url', 'instagram_url', 'tiktok_url'] as const) {
    const value = form[key].trim()
    if (value) {
      try {
        const url = new URL(value)
        if (!/^https:\/\//i.test(value) || url.protocol !== 'https:') throw new Error('Invalid URL')
      } catch {
        errors[key] = 'أدخل رابطًا صحيحًا يبدأ بـ https:// أو اترك الحقل فارغًا.'
      }
    }
  }

  const areas = form.delivery_areas.map((area) => area.trim())
  const normalizedAreas = areas.map((area) => area.toLocaleLowerCase())
  if (areas.length === 0) {
    errors.delivery_areas = 'أضف منطقة توصيل واحدة على الأقل، ثم احفظ الإعدادات.'
  } else if (areas.some((area) => !area) || new Set(normalizedAreas).size !== areas.length) {
    errors.delivery_areas = 'احذف أسماء المناطق الفارغة أو المكررة، ثم احفظ مرة أخرى.'
  }

  if (Object.keys(errors).length > 0) return { valid: false, errors }
  return {
    valid: true,
    errors: {},
    values: {
      ...form,
      shop_name: form.shop_name.trim(),
      whatsapp_number: whatsappNumber || '',
      phone_number: form.phone_number.trim(),
      address: form.address.trim(),
      map_lat: latitude,
      map_lng: longitude,
      opening_hours_text: form.opening_hours_text.trim(),
      facebook_url: form.facebook_url.trim(),
      instagram_url: form.instagram_url.trim(),
      tiktok_url: form.tiktok_url.trim(),
      delivery_areas: areas,
    },
  }
}
