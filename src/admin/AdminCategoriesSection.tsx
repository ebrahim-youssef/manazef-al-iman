import styles from './AdminProductsPage.module.css'
import { ActionIcon, Button, Paper, TextInput, UnstyledButton } from '@mantine/core'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useRouter } from '@tanstack/react-router'
import { CaretDown, CaretLeft, CaretUp, X } from '@phosphor-icons/react'
import { useAdminClient } from './AdminClientContext'
import { validateCategoryName } from './adminCategories'
import { writeProductWithImages } from './adminProducts'
import { makeProductImages } from './productImage'
import { detailImagePath } from '../utils/imageUrl'

type Category = { id: string; name: string; image_path: string; sort_order: number }

export default function AdminCategories({ categories, reload }: { categories: Category[]; reload: () => Promise<void> }) {
  const client = useAdminClient()
  const router = useRouter()
  const [editing, setEditing] = useState<Category | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const preview = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo])
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview) }, [preview])

  function getImageSrc(path: string) {
    return /^https?:\/\//i.test(path) ? path : client.storage.from('catalog').getPublicUrl(path).data.publicUrl
  }

  async function refresh() {
    await reload()
    await router.invalidate()
  }

  async function move(index: number, direction: number) {
    const other = index + direction
    if (busy || other < 0 || other >= categories.length) return
    setBusy(true)
    setError('')
    try {
      const reordered = [...categories]
      ;[reordered[index], reordered[other]] = [reordered[other]!, reordered[index]!]
      const { error: updateError } = await client.rpc('reorder_categories', { category_ids: reordered.map((category) => category.id) })
      if (updateError) throw updateError
      await refresh()
    } catch {
      await reload()
      setError('تعذر حفظ الترتيب بالكامل. راجع ترتيب الأقسام ثم حاول مجددًا.')
    } finally {
      setBusy(false)
    }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return
    const validationError = validateCategoryName(editing.name, editing.id, categories)
    if (validationError) { setError(validationError); return }
    setBusy(true)
    setError('')
    let cleanupFailed = false
    const uploaded: string[] = []
    try {
      await writeProductWithImages({
        upload: async () => {
          if (!photo) return []
          const images = await makeProductImages(photo)
          const base = `categories/${crypto.randomUUID()}`
          try {
            for (const [path, blob] of [[`${base}.webp`, images.card], [`${base}-detail.webp`, images.detail]] as const) {
              const { error: uploadError } = await client.storage.from('catalog').upload(path, blob, { contentType: 'image/webp', upsert: false })
              if (uploadError) throw uploadError
              uploaded.push(path)
            }
          } catch (uploadError) {
            if (uploaded.length) cleanupFailed = Boolean((await client.storage.from('catalog').remove(uploaded)).error)
            throw uploadError
          }
          return uploaded
        },
        write: async (paths) => {
          const result = await client.from('categories').update({ name: editing.name.trim(), ...(paths[0] ? { image_path: paths[0] } : {}) }).eq('id', editing.id).select('id').single()
          return { error: result.error }
        },
        removeNew: async (paths) => { if (paths.length) cleanupFailed = Boolean((await client.storage.from('catalog').remove(paths)).error) },
        removeOld: async () => {
          if (editing.image_path && !/^https?:\/\//i.test(editing.image_path)) cleanupFailed = Boolean((await client.storage.from('catalog').remove([editing.image_path, detailImagePath(editing.image_path)])).error)
        },
      })
      setEditing(null)
      setPhoto(null)
      await refresh()
      if (cleanupFailed) setError('حُفظ القسم، لكن تعذر حذف الصورة السابقة. راجع التخزين.')
    } catch {
      setError(cleanupFailed ? 'تعذر حفظ القسم وحذف الصور المرفوعة. راجع التخزين ثم حاول مجددًا.' : 'تعذر حفظ القسم. تحقق من الاتصال ثم حاول مجددًا.')
    } finally { setBusy(false) }
  }

  return <Paper component="details" className={styles['admin-categories']}>
    <summary><span><strong>الأقسام</strong> عدّل الاسم والصورة والترتيب</span><CaretLeft size={18} aria-hidden="true" /></summary>
    {error && !editing && <p className={styles['admin-error']} role="alert">{error}</p>}
    <ol className={styles['admin-category-list']}>{categories.map((category, index) => <li key={category.id}>
      <UnstyledButton type="button" className={styles['admin-category-open']} disabled={busy} onClick={() => { setEditing(category); setPhoto(null); setError('') }}>
        <img src={getImageSrc(category.image_path)} alt="" loading="lazy" />
        <span>{category.name}</span>
      </UnstyledButton>
      <ActionIcon variant="default" type="button" className={styles['admin-category-move']} disabled={busy || index === 0} aria-label={`نقل ${category.name} لأعلى`} onClick={() => void move(index, -1)}><CaretUp size={20} /></ActionIcon>
      <ActionIcon variant="default" type="button" className={styles['admin-category-move']} disabled={busy || index === categories.length - 1} aria-label={`نقل ${category.name} لأسفل`} onClick={() => void move(index, 1)}><CaretDown size={20} /></ActionIcon>
    </li>)}</ol>
    {editing && <div className={styles['admin-product-modal-backdrop']} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditing(null) }}>
      <section className={styles['admin-product-modal']} role="dialog" aria-modal="true" aria-labelledby="admin-category-form-title">
        <header><h2 id="admin-category-form-title">تعديل القسم</h2><ActionIcon variant="default" type="button" aria-label="إغلاق" disabled={busy} onClick={() => setEditing(null)}><X size={20} /></ActionIcon></header>
        <form onSubmit={(event) => void save(event)}>
          <TextInput label="اسم القسم" required withAsterisk={false} maxLength={40} value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.currentTarget.value })} />
          <div className={styles['admin-product-photo']}><strong>صورة القسم</strong><img src={preview || getImageSrc(editing.image_path)} alt="معاينة صورة القسم" />
            <Button component="label" variant="default">التقط صورة<input type="file" accept="image/*" capture="environment" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /></Button>
            <Button component="label" variant="default">اختر من المعرض<input type="file" accept="image/*" onChange={(event) => setPhoto(event.target.files?.[0] ?? null)} /></Button>
          </div>
          {error && <p className={styles['admin-error']} role="alert">{error}</p>}
          <footer><Button type="submit" disabled={busy}>{busy ? 'جارٍ الحفظ…' : 'حفظ القسم'}</Button></footer>
        </form>
      </section>
    </div>}
  </Paper>
}
