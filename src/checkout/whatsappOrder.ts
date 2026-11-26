import { formatPrice } from '../utils/format'

const ARABIC_INDIC_DIGITS = '٠١٢٣٤٥٦٧٨٩'

export function normalizeEgyptianMobile(value: string) {
  return value.replace(/[٠-٩]/g, (digit) => String(ARABIC_INDIC_DIGITS.indexOf(digit))).replace(/\s+/g, '')
}

export function isEgyptianMobile(value: string) {
  return /^01[0125]\d{8}$/.test(normalizeEgyptianMobile(value))
}

export function buildOrderMessage({
  code,
  customer,
  items,
  total,
}: {
  code: string
  customer: { name: string; phone: string; area: string; address: string; notes?: string }
  items: { name: string; quantity: number; lineTotal: number }[]
  total: number
}) {
  const lines = [
    `طلب جديد #${code}`,
    `الاسم: ${customer.name.trim()}`,
    `الموبايل: ${normalizeEgyptianMobile(customer.phone)}`,
    `المنطقة: ${customer.area}`,
    `العنوان: ${customer.address.trim()}`,
  ]
  const notes = customer.notes?.trim()
  if (notes) lines.push(`ملاحظات: ${notes}`)
  lines.push('', ...items.map((item) => `- ${item.name} × ${item.quantity} = ${formatPrice(item.lineTotal)} ج`), `الإجمالي بدون التوصيل: ${formatPrice(total)} ج`)
  return lines.join('\n')
}
