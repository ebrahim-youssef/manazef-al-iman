export function validateCategoryName(name: string, id: string, categories: { id: string; name: string }[]) {
  const trimmedName = name.trim()
  if (!trimmedName) return 'أدخل اسم القسم.'
  if (trimmedName.length > 40) return 'أدخل اسمًا لا يزيد على ٤٠ حرفًا.'
  if (categories.some((category) => category.id !== id && category.name.trim().toLocaleLowerCase() === trimmedName.toLocaleLowerCase())) return 'اختر اسمًا مختلفًا عن أسماء الأقسام الأخرى.'
  return ''
}
