import { Button, Group, Paper, TextInput } from '@mantine/core'
import { useState, type FormEvent } from 'react'
import { useAdminClient } from './AdminClientContext'

type Brand = { id: string; name: string; arabic_name: string | null }

export default function AdminBrandsSection({ brands, reload }: { brands: Brand[]; reload: () => Promise<void> }) {
  const client = useAdminClient()
  const [editing, setEditing] = useState<Brand | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing || busy) return
    const name = editing.name.trim()
    if (!name) { setError('أدخل اسم العلامة التجارية.'); return }
    setBusy(true)
    const { error: updateError } = await client.from('brands').update({ name }).eq('id', editing.id)
    if (updateError) setError(updateError.code === '23505' ? 'اختر اسمًا مختلفًا عن العلامات التجارية الأخرى.' : 'تعذر حفظ العلامة. تحقق من الاتصال ثم حاول مجددًا.')
    else { setEditing(null); setError(''); await reload() }
    setBusy(false)
  }

  async function remove(brand: Brand) {
    if (busy) return
    setBusy(true)
    const { error: deleteError } = await client.from('brands').delete().eq('id', brand.id)
    if (deleteError?.code === '23503') {
      const { count, error: countError } = await client.from('products').select('id', { count: 'exact', head: true }).eq('brand_id', brand.id)
      setError(countError || count === null ? 'هذه العلامة مستخدمة. انقل المنتجات أو احذفها أولًا.' : `هذه العلامة مستخدمة في ${count} منتج. انقلها أو احذف المنتجات أولًا.`)
    } else if (deleteError) setError('تعذر حذف العلامة. تحقق من الاتصال ثم حاول مجددًا.')
    else { setError(''); await reload() }
    setBusy(false)
  }

  return <Paper component="details" withBorder p="md" mb="md" onToggle={(event) => setIsOpen(event.currentTarget.open)}>
    <summary>العلامات التجارية</summary>
    {error && <p role="alert">{error}</p>}
    {isOpen && brands.map((brand) => <Group key={brand.id} justify="space-between" mt="sm">
      <span>{brand.name}</span>
      <Group gap="xs"><Button variant="default" disabled={busy} aria-label={`تعديل ${brand.name}`} onClick={() => { setEditing(brand); setError('') }}>تعديل</Button><Button color="red" variant="subtle" disabled={busy} aria-label={`حذف ${brand.name}`} onClick={() => void remove(brand)}>حذف</Button></Group>
    </Group>)}
    {editing && <form onSubmit={(event) => void save(event)}><TextInput label="اسم العلامة التجارية" value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.currentTarget.value })} /><Group mt="sm"><Button type="submit" disabled={busy}>حفظ العلامة</Button><Button variant="default" type="button" onClick={() => setEditing(null)}>إلغاء</Button></Group></form>}
  </Paper>
}
