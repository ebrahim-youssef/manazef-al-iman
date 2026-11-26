const CARD_WIDTH = 400
const DETAIL_WIDTH = 1000
const CARD_MAX_BYTES = 40 * 1024
const DETAIL_MAX_BYTES = 150 * 1024

function canvasBlob(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('تعذر تجهيز الصورة. اختر صورة أخرى.')), 'image/webp', quality)
  })
}

async function resizeImage(file: File, maxWidth: number, maxBytes: number) {
  const image = await createImageBitmap(file)
  let width = Math.min(image.width, maxWidth)
  while (width >= 1) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = Math.max(1, Math.round(image.height * width / image.width))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('تعذر تجهيز الصورة. حاول باستخدام متصفح أحدث.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.84, 0.74, 0.64, 0.54, 0.44]) {
      const blob = await canvasBlob(canvas, quality)
      if (blob.size <= maxBytes) {
        image.close()
        return blob
      }
    }
    if (width === 1) break
    width = Math.max(1, Math.floor(width * 0.85))
  }
  image.close()
  throw new Error('تعذر ضغط الصورة للحجم المطلوب. اختر صورة أبسط أو أصغر.')
}

export async function makeProductImages(file: File) {
  if (!file.type.startsWith('image/')) throw new Error('اختر ملف صورة صالحًا.')
  const [card, detail] = await Promise.all([
    resizeImage(file, CARD_WIDTH, CARD_MAX_BYTES),
    resizeImage(file, DETAIL_WIDTH, DETAIL_MAX_BYTES),
  ])
  return { card, detail }
}
