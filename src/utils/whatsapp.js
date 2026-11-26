import { formatEGP } from './format';
import { shopDefaults } from '../config/shopDefaults';

const WHATSAPP_PHONE = shopDefaults.whatsapp_number;

export function buildWhatsAppMessage(items, total) {
  const lines = [];
  lines.push('السلام عليكم، عندي طلب جديد من موقع منظفات الإيمان.');
  lines.push('');
  lines.push('المنتجات:');
  items.forEach((item, index) => {
    const lineTotal = item.price * item.quantity;
    lines.push(`${index + 1}. ${item.name} × ${item.quantity} = ${formatEGP(lineTotal)}`);
  });
  lines.push('');
  lines.push(`الإجمالي: ${formatEGP(total)}`);
  lines.push('');
  lines.push('برجاء تأكيد الطلب وتحديد تكلفة التوصيل.');
  return lines.join('\n');
}

export function buildWhatsAppUrl(items, total) {
  const message = buildWhatsAppMessage(items, total);
  return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(message)}`;
}
