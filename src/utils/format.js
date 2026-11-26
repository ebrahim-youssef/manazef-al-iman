export function formatPrice(value) {
  const num = Number(value) || 0;
  return num.toLocaleString('ar-EG');
}

export function formatEGP(value) {
  return `${formatPrice(value)} جنيه`;
}
