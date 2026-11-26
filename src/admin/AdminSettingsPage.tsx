import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { useRouter } from '@tanstack/react-router'
import { useAdminClient } from './AdminClientContext'
import { validateShopSettings, type ShopSettingsForm } from './adminSettings'
import { shopDefaults } from '../config/shopDefaults'
import './AdminSettingsPage.css'

const emptySettings: ShopSettingsForm = {
  shop_name: '',
  whatsapp_number: '',
  phone_number: '',
  address: '',
  map_lat: '',
  map_lng: '',
  opening_hours_text: '',
  facebook_url: '',
  instagram_url: '',
  tiktok_url: '',
  delivery_areas: [],
}

function getFormValue(value: unknown) {
  return value === null || value === undefined ? '' : String(value)
}

export default function AdminSettingsPage() {
  const client = useAdminClient()
  const router = useRouter()
  const [settings, setSettings] = useState(emptySettings)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [success, setSuccess] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof ShopSettingsForm, string>>>({})

  useEffect(() => {
    let isActive = true
    void client.from('settings')
      .select('shop_name, whatsapp_number, phone_number, address, map_lat, map_lng, opening_hours_text, facebook_url, instagram_url, tiktok_url, delivery_areas')
      .maybeSingle()
      .then(({ data, error }) => {
        if (!isActive) return
        setIsLoading(false)
        if (error || !data) {
          setLoadError('تعذر تحميل الإعدادات. تحقق من اتصالك ثم أعد فتح الصفحة.')
          return
        }
        setSettings({
          shop_name: getFormValue(data.shop_name),
          whatsapp_number: getFormValue(data.whatsapp_number),
          phone_number: getFormValue(data.phone_number),
          address: getFormValue(data.address),
          map_lat: getFormValue(data.map_lat),
          map_lng: getFormValue(data.map_lng),
          opening_hours_text: getFormValue(data.opening_hours_text),
          facebook_url: getFormValue(data.facebook_url),
          instagram_url: getFormValue(data.instagram_url),
          tiktok_url: getFormValue(data.tiktok_url),
          delivery_areas: Array.isArray(data.delivery_areas) ? data.delivery_areas.map(String) : [],
        })
      }, () => {
        if (!isActive) return
        setIsLoading(false)
        setLoadError('تعذر تحميل الإعدادات. تحقق من اتصالك ثم أعد فتح الصفحة.')
      })
    return () => { isActive = false }
  }, [client])

  function updateField(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.currentTarget
    setSettings((current) => ({ ...current, [name]: value }))
    setErrors((current) => ({ ...current, [name]: undefined }))
    setSuccess('')
    setSaveError('')
  }

  function updateArea(index: number, value: string) {
    setSettings((current) => ({ ...current, delivery_areas: current.delivery_areas.map((area, areaIndex) => areaIndex === index ? value : area) }))
    setErrors((current) => ({ ...current, delivery_areas: undefined }))
    setSuccess('')
    setSaveError('')
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = validateShopSettings(settings)
    setErrors(result.valid ? {} : result.errors)
    setSuccess('')
    setSaveError('')
    if (!result.valid) return

    setIsSaving(true)
    let response
    try {
      response = await client.from('settings')
        .update(result.values)
        .eq('id', true)
        .select('id')
        .maybeSingle()
    } catch {
      setSaveError('تعذر حفظ الإعدادات. تحقق من اتصالك ثم حاول مرة أخرى.')
      setIsSaving(false)
      return
    }
    const { data, error } = response
    if (error || !data) {
      setSaveError('تعذر حفظ الإعدادات. تحقق من اتصالك وصلاحية حساب المالك ثم حاول مرة أخرى.')
      setIsSaving(false)
      return
    }

    setSettings((current) => ({
      ...current,
      ...result.values,
      map_lat: result.values.map_lat === null ? '' : String(result.values.map_lat),
      map_lng: result.values.map_lng === null ? '' : String(result.values.map_lng),
    }))
    try {
      await router.invalidate()
      setSuccess('حُفظت الإعدادات وتحدّثت بيانات الموقع.')
    } catch {
      setSuccess('حُفظت الإعدادات. أعد تحميل الصفحة إذا لم تظهر القيم الجديدة في الموقع.')
    }
    setIsSaving(false)
  }

  return (
    <main className="admin-shell" dir="rtl">
      <div className="admin-page admin-settings-page">
        <header className="admin-header"><div className="admin-header-copy"><h1>إعدادات المتجر</h1><p>تظهر التغييرات على الموقع بعد الحفظ.</p></div></header>
        {isLoading && <p className="admin-loading" role="status">جارٍ تحميل الإعدادات…</p>}
        {loadError && <p className="admin-error" role="alert">{loadError}</p>}
        {!isLoading && !loadError && (
          <form className="admin-settings-form" onSubmit={saveSettings} noValidate>
            <fieldset className="admin-settings-fields" disabled={isSaving}>
            <section className="admin-settings-section" aria-labelledby="settings-contact-title">
              <h2 id="settings-contact-title">بيانات المتجر والتواصل</h2>
              <label className="admin-settings-field" htmlFor="shop-name">اسم المتجر
                <input id="shop-name" name="shop_name" value={settings.shop_name} placeholder={shopDefaults.shop_name} onChange={updateField} />
              </label>
              <label className="admin-settings-field" htmlFor="whatsapp-number">رقم واتساب
                <input id="whatsapp-number" name="whatsapp_number" type="tel" inputMode="tel" dir="ltr" value={settings.whatsapp_number} placeholder={shopDefaults.whatsapp_number} onChange={updateField} aria-invalid={Boolean(errors.whatsapp_number)} aria-describedby={errors.whatsapp_number ? 'whatsapp-number-error' : undefined} />
                {errors.whatsapp_number && <span className="admin-settings-field-error" id="whatsapp-number-error">{errors.whatsapp_number}</span>}
              </label>
              <label className="admin-settings-field" htmlFor="phone-number">رقم الهاتف
                <input id="phone-number" name="phone_number" type="tel" inputMode="tel" dir="ltr" value={settings.phone_number} placeholder={shopDefaults.phone_number} onChange={updateField} />
              </label>
              <label className="admin-settings-field" htmlFor="shop-address">العنوان
                <input id="shop-address" name="address" value={settings.address} placeholder={shopDefaults.address} onChange={updateField} />
              </label>
              <div className="admin-settings-coordinate-row">
                <label className="admin-settings-field" htmlFor="map-lat">خط العرض
                  <input id="map-lat" name="map_lat" type="number" inputMode="decimal" step="any" dir="ltr" value={settings.map_lat} placeholder={String(shopDefaults.map_lat)} onChange={updateField} aria-invalid={Boolean(errors.map_lat)} aria-describedby={errors.map_lat ? 'map-lat-error' : undefined} />
                </label>
                <label className="admin-settings-field" htmlFor="map-lng">خط الطول
                  <input id="map-lng" name="map_lng" type="number" inputMode="decimal" step="any" dir="ltr" value={settings.map_lng} placeholder={String(shopDefaults.map_lng)} onChange={updateField} aria-invalid={Boolean(errors.map_lng)} aria-describedby={errors.map_lng ? 'map-lng-error' : undefined} />
                </label>
              </div>
              {errors.map_lat && <p className="admin-settings-field-error" id="map-lat-error">{errors.map_lat}</p>}
              {errors.map_lng && <p className="admin-settings-field-error" id="map-lng-error">{errors.map_lng}</p>}
              <label className="admin-settings-field" htmlFor="opening-hours">ساعات العمل
                <textarea id="opening-hours" name="opening_hours_text" rows={3} value={settings.opening_hours_text} placeholder={shopDefaults.opening_hours_text} onChange={updateField} />
              </label>
            </section>

            <section className="admin-settings-section" aria-labelledby="settings-social-title">
              <h2 id="settings-social-title">روابط التواصل الاجتماعي</h2>
              <label className="admin-settings-field" htmlFor="facebook-url">فيسبوك
                <input id="facebook-url" name="facebook_url" type="url" dir="ltr" value={settings.facebook_url} placeholder={shopDefaults.facebook_url} onChange={updateField} aria-invalid={Boolean(errors.facebook_url)} aria-describedby={errors.facebook_url ? 'facebook-url-error' : undefined} />
                {errors.facebook_url && <span className="admin-settings-field-error" id="facebook-url-error">{errors.facebook_url}</span>}
              </label>
              <label className="admin-settings-field" htmlFor="instagram-url">إنستجرام
                <input id="instagram-url" name="instagram_url" type="url" dir="ltr" value={settings.instagram_url} placeholder={shopDefaults.instagram_url} onChange={updateField} aria-invalid={Boolean(errors.instagram_url)} aria-describedby={errors.instagram_url ? 'instagram-url-error' : undefined} />
                {errors.instagram_url && <span className="admin-settings-field-error" id="instagram-url-error">{errors.instagram_url}</span>}
              </label>
              <label className="admin-settings-field" htmlFor="tiktok-url">تيك توك
                <input id="tiktok-url" name="tiktok_url" type="url" dir="ltr" value={settings.tiktok_url} placeholder={shopDefaults.tiktok_url} onChange={updateField} aria-invalid={Boolean(errors.tiktok_url)} aria-describedby={errors.tiktok_url ? 'tiktok-url-error' : undefined} />
                {errors.tiktok_url && <span className="admin-settings-field-error" id="tiktok-url-error">{errors.tiktok_url}</span>}
              </label>
            </section>

            <section className="admin-settings-section" aria-labelledby="settings-areas-title">
              <div className="admin-settings-section-heading">
                <div><h2 id="settings-areas-title">مناطق التوصيل</h2><p>أضف اسم كل منطقة كما سيظهر للعميل.</p></div>
                <button className="admin-settings-secondary-button" type="button" onClick={() => setSettings((current) => ({ ...current, delivery_areas: [...current.delivery_areas, ''] }))}>إضافة منطقة</button>
              </div>
              {settings.delivery_areas.length === 0 && <p className="admin-settings-empty">لم تُضف مناطق توصيل بعد.</p>}
              <ul className="admin-settings-area-list">
                {settings.delivery_areas.map((area, index) => (
                  <li key={index}>
                    <label className="admin-settings-field" htmlFor={`delivery-area-${index}`}>المنطقة {index + 1}
                      <input id={`delivery-area-${index}`} value={area} onChange={(event) => updateArea(index, event.currentTarget.value)} aria-invalid={Boolean(errors.delivery_areas)} aria-describedby={errors.delivery_areas ? 'delivery-areas-error' : undefined} />
                    </label>
                    <button className="admin-settings-remove-button" type="button" onClick={() => setSettings((current) => ({ ...current, delivery_areas: current.delivery_areas.filter((_, areaIndex) => areaIndex !== index) }))}>حذف</button>
                  </li>
                ))}
              </ul>
              {errors.delivery_areas && <p className="admin-settings-field-error" id="delivery-areas-error">{errors.delivery_areas}</p>}
            </section>

            </fieldset>
            {saveError && <p className="admin-settings-message is-error" role="alert">{saveError}</p>}
            {success && <p className="admin-settings-message is-success" role="status">{success}</p>}
            <button className="admin-settings-save-button" type="submit" disabled={isSaving}>
              {isSaving ? 'جارٍ الحفظ…' : 'حفظ الإعدادات'}
            </button>
          </form>
        )}
      </div>
    </main>
  )
}
