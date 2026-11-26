export function getMapEmbedUrl(latitude: number | null, longitude: number | null, address: string) {
  const location = latitude !== null && longitude !== null
    ? `${latitude},${longitude}`
    : encodeURIComponent(address)
  return `https://www.google.com/maps?q=${location}&output=embed`
}

export function getMapSearchUrl(latitude: number | null, longitude: number | null, address: string) {
  const location = latitude !== null && longitude !== null
    ? `${latitude},${longitude}`
    : address
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

export function getWhatsAppUrl(number: string) {
  return `https://wa.me/${encodeURIComponent(number)}`
}
