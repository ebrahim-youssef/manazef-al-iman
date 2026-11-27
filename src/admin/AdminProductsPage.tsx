import { Plus, Spinner, Trash, X } from '@phosphor-icons/react'
import { Combobox, Group, Image, InputBase, Text, useCombobox } from '@mantine/core'
import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react'
import { calculatePrice } from '../pricing/price'
import { formatEGP } from '../utils/format'
import { detailImagePath } from '../utils/imageUrl'
import { searchIndex } from '../search/search'
import { useAdminClient } from './AdminClientContext'
import { filterProducts, formatCairoDateTime, parseCairoDateTime, productImagePaths, validateProduct, writeProductWithImages, type ProductDraft } from './adminProducts'
import { makeProductImages } from './productImage'
import AdminCategories from './AdminCategoriesSection'
import AdminBrandsSection from './AdminBrandsSection'
import './AdminProductsPage.css'

type Product = ProductDraft & { created_at: string; updated_at: string }
type Category = { id: string; name: string; image_path: string; sort_order: number }
type Brand = { id: string; name: string; arabic_name: string | null }

function normalizeBrandName(value: string) {
  return value.replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي')
    .replace(/[\u064b-\u065f\u0670\u0640]/g, '').toLowerCase().trim().replace(/\s+/g, ' ')
}

const emptyProduct: ProductDraft = {
  id: '', category_id: '', name: '', brand_id: '', description: '', image_path: '', price_egp: Number.NaN,
  is_available: true, is_featured: false, sale_type: 'none', sale_value: null, sale_starts_at: null,
  sale_ends_at: null, friday_type: 'none', friday_value: null,
}

export default function AdminProductsPage() {
  const client = useAdminClient()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [brandSearch, setBrandSearch] = useState('')
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() })
  const searchCombobox = useCombobox({ onDropdownClose: () => searchCombobox.resetSelectedOption() })
  const nameCombobox = useCombobox({ onDropdownClose: () => nameCombobox.resetSelectedOption() })
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [availableOnly, setAvailableOnly] = useState(false)
  const [featuredOnly, setFeaturedOnly] = useState(false)
  const [editing, setEditing] = useState<ProductDraft | null>(null)
  const [previewTime, setPreviewTime] = useState<Date | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const photoPreviewUrl = useMemo(() => photo ? URL.createObjectURL(photo) : '', [photo])

  useEffect(() => () => {
    if (photoPreviewUrl) URL.revokeObjectURL(photoPreviewUrl)
  }, [photoPreviewUrl])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const loadProducts = useCallback(async () => {
    const [{ data, error: productError }, { data: categoryData, error: categoryError }, { data: brandData, error: brandError }] = await Promise.all([
      client.from('products').select('*').order('created_at', { ascending: false }),
      client.from('categories').select('id, name, image_path, sort_order').order('sort_order').order('id'),
      client.from('brands').select('id, name, arabic_name').order('name'),
    ])
    setLoading(false)
    if (productError || categoryError || brandError) {
      setError('تعذر تحميل المنتجات. تحقق من الاتصال ثم حاول مجددًا.')
      return
    }
    setError('')
    setProducts((data ?? []) as Product[])
    setCategories((categoryData ?? []) as Category[])
    setBrands((brandData ?? []) as Brand[])
  }, [client])

  // oxlint-disable-next-line react/set-state-in-effect -- Initial rows are loaded from Supabase after mount.
  useEffect(() => { void loadProducts() }, [loadProducts])

  const index = useMemo(() => ({
    products: products.map((product) => ({ ...product, brand: brands.find((brand) => brand.id === product.brand_id)?.name ?? '', brandArabic: brands.find((brand) => brand.id === product.brand_id)?.arabic_name, category: product.category_id, image: product.image_path, price: product.price_egp })),
    categories: categories.map((category) => ({ ...category, slug: category.id })),
  }), [products, brands, categories])
  const searchResults = useMemo(() => searchIndex(index, search), [index, search])
  const nameSuggestions = useMemo(() => searchIndex({ products: index.products.map((product) => ({ ...product, brand: '', brandArabic: '', category: '' })), categories: [] }, editing?.id ? '' : editing?.name ?? '').products, [index, editing?.id, editing?.name])
  const visibleProducts = useMemo(() => filterProducts(search.trim() ? searchResults.products : products, { search: '', categoryId, availableOnly, featuredOnly }), [products, search, searchResults, categoryId, availableOnly, featuredOnly])

  function openProduct(product?: Product) {
    setBrandSearch(brands.find((brand) => brand.id === product?.brand_id)?.name ?? '')
    setPreviewTime(new Date())
    setEditing(product ? {
      ...product,
      sale_starts_at: formatCairoDateTime(product.sale_starts_at),
      sale_ends_at: formatCairoDateTime(product.sale_ends_at),
    } : { ...emptyProduct, category_id: categories[0]?.id ?? '' })
    setPhoto(null)
    setError('')
  }

  function changePhoto(event: ChangeEvent<HTMLInputElement>) {
    setPhoto(event.target.files?.[0] ?? null)
    event.target.value = ''
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!editing) return
    if (!editing.brand_id) { setError('اختر العلامة التجارية أو أضفها أولًا.'); return }
    const validationError = validateProduct(editing)
    if (validationError) {
      setError(validationError)
      return
    }
    let saleStartsAt: string | null
    let saleEndsAt: string | null
    try {
      saleStartsAt = editing.sale_starts_at ? parseCairoDateTime(editing.sale_starts_at) : null
      saleEndsAt = editing.sale_ends_at ? parseCairoDateTime(editing.sale_ends_at) : null
    } catch (dateError) {
      setError(dateError instanceof Error ? dateError.message : 'اختر تاريخًا صالحًا بتوقيت القاهرة.')
      return
    }
    setBusy(true)
    setError('')
    const productId = editing.id || crypto.randomUUID()
    const imageId = photo ? crypto.randomUUID() : ''
    const paths = photo ? productImagePaths(imageId) : null
    const uploaded: string[] = []
    let imageCleanupFailed = false
    const oldImagePath = editing.image_path
    try {
      await writeProductWithImages({
        upload: async () => {
          if (!photo || !paths) return []
          const images = await makeProductImages(photo)
          try {
            for (const [path, blob] of [[paths.cardPath, images.card], [paths.detailPath, images.detail]] as const) {
              const { error: uploadError } = await client.storage.from('catalog').upload(path, blob, { contentType: 'image/webp', upsert: false })
              if (uploadError) throw uploadError
              uploaded.push(path)
            }
          } catch (uploadError) {
            if (uploaded.length) {
              const { error: cleanupError } = await client.storage.from('catalog').remove(uploaded)
              imageCleanupFailed = Boolean(cleanupError)
            }
            throw uploadError
          }
          return uploaded
        },
        write: async (uploadedPaths) => {
          const { image_path: imagePath, ...fields } = editing
          const value = { ...fields, id: productId, ...(!editing.id || uploadedPaths[0] ? { image_path: uploadedPaths[0] ?? imagePath } : {}), sale_value: editing.sale_type === 'none' ? null : editing.sale_value, friday_value: editing.friday_type === 'none' ? null : editing.friday_value, sale_starts_at: saleStartsAt, sale_ends_at: saleEndsAt, updated_at: new Date().toISOString() }
          const result = editing.id
            ? await client.from('products').update(value).eq('id', productId)
            : await client.from('products').insert(value)
          return { error: result.error }
        },
        removeNew: async (pathsToRemove) => {
          if (!pathsToRemove.length) return
          const { error: cleanupError } = await client.storage.from('catalog').remove(pathsToRemove)
          imageCleanupFailed = Boolean(cleanupError)
        },
        removeOld: async () => {
          if (oldImagePath && oldImagePath !== paths?.cardPath && !/^https?:\/\//i.test(oldImagePath)) {
            const { error: cleanupError } = await client.storage.from('catalog').remove([oldImagePath, detailImagePath(oldImagePath)])
            imageCleanupFailed = Boolean(cleanupError)
          }
        },
      })
      setEditing(null)
      setPhoto(null)
      setLoading(true)
      await loadProducts()
      if (imageCleanupFailed) setError('تم حفظ المنتج، لكن تعذر حذف الصورة السابقة.')
    } catch {
      setError(imageCleanupFailed ? 'تعذر حفظ المنتج وحذف الصور المرفوعة. تحقق من التخزين ثم حاول مجددًا.' : 'تعذر حفظ المنتج. تحقق من العلامة التجارية ثم حاول مجددًا.')
    } finally {
      setBusy(false)
    }
  }

  async function toggleProduct(product: Product, field: 'is_available' | 'is_featured') {
    const nextValue = !product[field]
    setProducts((current) => current.map((row) => row.id === product.id ? { ...row, [field]: nextValue } : row))
    const { error: updateError } = await client.from('products').update({ [field]: nextValue, updated_at: new Date().toISOString() }).eq('id', product.id)
    if (updateError) {
      setProducts((current) => current.map((row) => row.id === product.id ? { ...row, [field]: product[field] } : row))
      setError('تعذر تحديث المنتج. أعد المحاولة.')
    } else {
      setError('')
    }
  }

  async function deleteProduct() {
    if (!editing || !window.confirm('هل تريد حذف هذا المنتج؟')) return
    setBusy(true)
    setError('')
    const { error: deleteError } = await client.from('products').delete().eq('id', editing.id)
    if (deleteError) {
      setError('تعذر حذف المنتج. حاول مجددًا.')
      setBusy(false)
      return
    }
    let imageCleanupFailed = false
    if (editing.image_path && !/^https?:\/\//i.test(editing.image_path)) {
      const { error: cleanupError } = await client.storage.from('catalog').remove([editing.image_path, detailImagePath(editing.image_path)])
      imageCleanupFailed = Boolean(cleanupError)
    }
    setEditing(null)
    setBusy(false)
    setLoading(true)
    await loadProducts()
    if (imageCleanupFailed) setError('تم حذف المنتج، لكن تعذر حذف صوره من التخزين.')
  }

  function setField<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setEditing((current) => current ? { ...current, [field]: value } : current)
  }

  async function selectBrand(value: string) {
    if (value !== '$create') {
      const brand = brands.find((item) => item.id === value)
      if (brand) { setField('brand_id', brand.id); setBrandSearch(brand.name) }
      combobox.closeDropdown()
      return
    }
    const name = brandSearch.trim()
    const existing = brands.find((brand) => [brand.name, brand.arabic_name ?? ''].some((value) => normalizeBrandName(value) === normalizeBrandName(name)))
    if (existing) { setField('brand_id', existing.id); setBrandSearch(existing.name); combobox.closeDropdown(); return }
    setBusy(true)
    try {
      const { data, error: createError } = await client.from('brands').insert({ name }).select('id, name, arabic_name').single()
      let brand = data as Brand | null
      if (createError?.code === '23505') {
        const result = await client.from('brands').select('id, name, arabic_name').eq('normalized_name', normalizeBrandName(name)).maybeSingle()
        brand = result.data as Brand | null
      }
      if (!brand) throw new Error('Brand creation or lookup failed')
      const selected = brand
      setBrands((current) => [...current.filter((item) => item.id !== selected.id), selected])
      setField('brand_id', brand.id)
      setBrandSearch(brand.name)
      setError('')
      combobox.closeDropdown()
    } catch {
      setError('تعذر إضافة العلامة التجارية. تحقق من الاتصال ثم حاول مجددًا.')
    } finally {
      setBusy(false)
    }
  }

  let previewStartsAt: string | null = null
  let previewEndsAt: string | null = null
  try {
    previewStartsAt = editing?.sale_starts_at ? parseCairoDateTime(editing.sale_starts_at) : null
    previewEndsAt = editing?.sale_ends_at ? parseCairoDateTime(editing.sale_ends_at) : null
  } catch {
    // An incomplete date is validated on save.
  }
  const preview = editing && previewTime ? calculatePrice({
    price: editing.price_egp || 0,
    saleType: editing.sale_type,
    saleValue: editing.sale_value,
    saleStartsAt: previewStartsAt,
    saleEndsAt: previewEndsAt,
    fridayType: editing.friday_type,
    fridayValue: editing.friday_value,
  }, previewTime) : null

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-page admin-products-page">
        <header className="admin-header">
          <div className="admin-header-copy"><h1>المنتجات</h1><p>إدارة المنتجات والأسعار والصور</p></div>
          <button className="admin-primary-button admin-products-add" type="button" onClick={() => openProduct()}><Plus size={18} /> إضافة</button>
        </header>
        <AdminCategories categories={categories} reload={loadProducts} />
        <AdminBrandsSection brands={brands} reload={loadProducts} />
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-products-filters">
          <Combobox store={searchCombobox} onOptionSubmit={(id) => { const product = products.find((item) => item.id === id); if (product) openProduct(product); searchCombobox.closeDropdown() }}>
            <Combobox.Target><InputBase aria-label="البحث بالاسم" value={search} placeholder="ابحث باسم المنتج" maxLength={60} onChange={(event) => { setSearch(event.currentTarget.value); searchCombobox.openDropdown(); searchCombobox.resetSelectedOption() }} onFocus={() => { if (search) searchCombobox.openDropdown() }} /></Combobox.Target>
            <Combobox.Dropdown><Combobox.Options>{searchResults.products.slice(0, 6).map((product) => <Combobox.Option value={product.id} key={product.id}><Group wrap="nowrap" gap="sm"><Image src={product.image_path ? (/^https?:\/\//i.test(product.image_path) ? product.image_path : client.storage.from('catalog').getPublicUrl(product.image_path).data.publicUrl) : undefined} alt="" w={44} h={44} radius="sm" fit="cover" /><div><Text size="sm" fw={600}>{product.name}</Text><Text size="sm">{formatEGP(product.price_egp)}</Text></div></Group></Combobox.Option>)}{!searchResults.products.length && <Combobox.Empty>لا توجد منتجات مطابقة.</Combobox.Empty>}</Combobox.Options></Combobox.Dropdown>
          </Combobox>
          <select aria-label="تصفية حسب القسم" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="all">كل الأقسام</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <label className="admin-product-filter"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)} /> المتوفر فقط</label>
          <label className="admin-product-filter"><input type="checkbox" checked={featuredOnly} onChange={(event) => setFeaturedOnly(event.target.checked)} /> مختارات لك</label>
        </div>
        {loading ? <p className="admin-loading"><Spinner size={18} /> جارٍ تحميل المنتجات…</p> : visibleProducts.length === 0 ? <p className="admin-empty">لا توجد منتجات مطابقة.</p> : (
          <ul className="admin-product-list">
            {visibleProducts.map((product) => (
              <li className="admin-product-row" key={product.id}>
                <button type="button" className="admin-product-open" onClick={() => openProduct(product)}>
                  {product.image_path && <img src={/^https?:\/\//i.test(product.image_path) ? product.image_path : client.storage.from('catalog').getPublicUrl(product.image_path).data.publicUrl} alt="" />}
                  <span><strong>{product.name}</strong><small>{brands.find((brand) => brand.id === product.brand_id)?.name} · {categories.find((category) => category.id === product.category_id)?.name ?? 'قسم غير معروف'} · {formatEGP(product.price_egp)}</small></span>
                </button>
                <label className="admin-product-switch"><input type="checkbox" checked={product.is_available} onChange={() => void toggleProduct(product, 'is_available')} /> متوفر</label>
                <label className="admin-product-switch"><input type="checkbox" checked={product.is_featured} onChange={() => void toggleProduct(product, 'is_featured')} /> مختار</label>
              </li>
            ))}
          </ul>
        )}
      </div>
      {editing && (
        <div className="admin-product-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) setEditing(null) }}>
          <section className="admin-product-modal" role="dialog" aria-modal="true" aria-labelledby="admin-product-form-title">
            <header><h2 id="admin-product-form-title">{editing.id ? 'تعديل المنتج' : 'منتج جديد'}</h2><button type="button" aria-label="إغلاق" onClick={() => setEditing(null)} disabled={busy}><X size={20} /></button></header>
            <form onSubmit={(event) => void saveProduct(event)}>
              <label>القسم<select required value={editing.category_id} onChange={(event) => setField('category_id', event.target.value)}><option value="" disabled>اختر القسم</option>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label>
              <Combobox store={nameCombobox} onOptionSubmit={(id) => {
                const product = products.find((item) => item.id === id)
                if (product) {
                  setEditing((current) => current ? { ...current, name: product.name, category_id: product.category_id, brand_id: product.brand_id, description: product.description } : current)
                  setBrandSearch(brands.find((brand) => brand.id === product.brand_id)?.name ?? '')
                }
                nameCombobox.closeDropdown()
              }}>
                <Combobox.Target><InputBase label="اسم المنتج" required value={editing.name} onChange={(event) => { setField('name', event.currentTarget.value); if (!editing.id) nameCombobox.openDropdown() }} onFocus={() => { if (!editing.id && editing.name) nameCombobox.openDropdown() }} /></Combobox.Target>
                <Combobox.Dropdown><Combobox.Options>{nameSuggestions.slice(0, 6).map((product) => <Combobox.Option value={product.id} key={product.id}>{product.name}</Combobox.Option>)}</Combobox.Options></Combobox.Dropdown>
              </Combobox>
              <Combobox store={combobox} onOptionSubmit={(value) => void selectBrand(value)}>
                <Combobox.Target><InputBase label="العلامة التجارية" aria-label="العلامة التجارية" required value={brandSearch} onChange={(event) => { setBrandSearch(event.currentTarget.value); setField('brand_id', ''); combobox.openDropdown() }} onFocus={() => combobox.openDropdown()} /></Combobox.Target>
                <Combobox.Dropdown><Combobox.Options>
                  {brands.filter((brand) => [brand.name, brand.arabic_name ?? ''].some((name) => normalizeBrandName(name).includes(normalizeBrandName(brandSearch)))).map((brand) => <Combobox.Option value={brand.id} key={brand.id}>{brand.name}</Combobox.Option>)}
                  {brandSearch.trim() && <Combobox.Option value="$create">إضافة «{brandSearch.trim()}»</Combobox.Option>}
                </Combobox.Options></Combobox.Dropdown>
              </Combobox>
              <label>الوصف<textarea rows={3} value={editing.description} onChange={(event) => setField('description', event.target.value)} /></label>
              <label>السعر بالجنيه<input required type="number" min="1" step="1" value={Number.isNaN(editing.price_egp) ? '' : editing.price_egp} onChange={(event) => setField('price_egp', event.target.value === '' ? Number.NaN : Number(event.target.value))} /></label>
              <div className="admin-product-checks"><label><input type="checkbox" checked={editing.is_available} onChange={(event) => setField('is_available', event.target.checked)} /> متوفر</label><label><input type="checkbox" checked={editing.is_featured} onChange={(event) => setField('is_featured', event.target.checked)} /> مختار لك</label></div>
              <fieldset><legend>عرض محدد المدة</legend><label>نوع العرض<select value={editing.sale_type} onChange={(event) => setField('sale_type', event.target.value as ProductDraft['sale_type'])}><option value="none">بدون عرض</option><option value="price">سعر محدد</option><option value="percent">نسبة خصم</option></select></label>{editing.sale_type !== 'none' && <><label>{editing.sale_type === 'price' ? 'سعر العرض بالجنيه' : 'نسبة الخصم'}<input type="number" min="1" max={editing.sale_type === 'percent' ? 90 : undefined} step="1" value={editing.sale_value ?? ''} onChange={(event) => setField('sale_value', event.target.value === '' ? null : Number(event.target.value))} /></label><label>يبدأ في<input type="datetime-local" value={editing.sale_starts_at ?? ''} onChange={(event) => setField('sale_starts_at', event.target.value || null)} /></label><label>ينتهي في<input type="datetime-local" value={editing.sale_ends_at ?? ''} onChange={(event) => setField('sale_ends_at', event.target.value || null)} /></label></>}</fieldset>
              <fieldset><legend>عرض الجمعة</legend><label>نوع العرض<select value={editing.friday_type} onChange={(event) => setField('friday_type', event.target.value as ProductDraft['friday_type'])}><option value="none">بدون عرض</option><option value="price">سعر محدد</option><option value="percent">نسبة خصم</option></select></label>{editing.friday_type !== 'none' && <label>{editing.friday_type === 'price' ? 'سعر الجمعة بالجنيه' : 'نسبة خصم الجمعة'}<input type="number" min="1" max={editing.friday_type === 'percent' ? 90 : undefined} step="1" value={editing.friday_value ?? ''} onChange={(event) => setField('friday_value', event.target.value === '' ? null : Number(event.target.value))} /></label>}</fieldset>
              {preview && <p className="admin-product-price-preview">السعر المعروض الآن: <strong>{formatEGP(preview.shownPrice)}</strong></p>}
              <div className="admin-product-photo"><strong>صورة المنتج</strong>{(photoPreviewUrl || editing.image_path) && <img src={photoPreviewUrl || (/^https?:\/\//i.test(editing.image_path) ? editing.image_path : client.storage.from('catalog').getPublicUrl(editing.image_path).data.publicUrl)} alt="معاينة صورة المنتج" />}<label className="admin-secondary-button">التقط صورة<input type="file" accept="image/*" capture="environment" onChange={changePhoto} /></label><label className="admin-secondary-button">اختر من المعرض<input type="file" accept="image/*" onChange={changePhoto} /></label>{photo && <small>صورة جديدة، تُرفع عند الحفظ.</small>}</div>
              {error && <p className="admin-error" role="alert">{error}</p>}
              <footer><button className="admin-primary-button" type="submit" disabled={busy || !categories.length}>{busy ? 'جارٍ الحفظ…' : 'حفظ المنتج'}</button>{editing.id && <button className="admin-danger-button" type="button" disabled={busy} onClick={() => void deleteProduct()}><Trash size={17} /> حذف</button>}</footer>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}
