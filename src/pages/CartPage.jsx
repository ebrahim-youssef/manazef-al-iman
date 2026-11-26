import { useEffect, useState } from 'react';
import { Link, useLoaderData } from '@tanstack/react-router';
import { Minus, Plus, ShoppingCart, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { getCurrentCartLines, createOrder } from '../data/orders';
import { useCart } from '../context/useCart';
import { formatEGP } from '../utils/format';
import { buildOrderMessage, isEgyptianMobile, normalizeEgyptianMobile } from '../checkout/whatsappOrder';
import { Route as RootRoute } from '../routes/__root';
import './CartPage.css';

const CHECKOUT_STORAGE_KEY = 'iman-checkout';
const EMPTY_FORM = { name: '', phone: '', area: '', address: '', notes: '' };

function loadCheckoutForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(CHECKOUT_STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return EMPTY_FORM;
    return Object.fromEntries(Object.keys(EMPTY_FORM).map((key) => [key, typeof saved[key] === 'string' ? saved[key] : '']));
  } catch {
    return EMPTY_FORM;
  }
}

export default function CartPage() {
  const { items, hasLoaded, itemCount, removeItem, updateQty, clearCart } = useCart();
  const settings = useLoaderData({ from: RootRoute.id });
  const [lines, setLines] = useState([]);
  const [loadedCartKey, setLoadedCartKey] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formLoaded, setFormLoaded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!hasLoaded) return;
    if (items.length === 0) return undefined;
    let isCurrent = true;
    const cartKey = JSON.stringify(items);
    getCurrentCartLines({ data: items }).then((currentLines) => {
      if (isCurrent) {
        setLines(currentLines);
        setLoadedCartKey(cartKey);
      }
    }).catch(() => {
      if (isCurrent) {
        setError('تعذر تحديث أسعار المنتجات. أعد المحاولة بعد قليل.');
        setLines([]);
        setLoadedCartKey(cartKey);
      }
    });
    return () => { isCurrent = false; };
  }, [hasLoaded, items]);

  // Restore browser-only checkout values after hydration to keep server markup stable.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setForm(loadCheckoutForm());
    // oxlint-disable-next-line react/set-state-in-effect
    setFormLoaded(true);
  }, []);

  useEffect(() => {
    if (formLoaded) localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(form));
  }, [form, formLoaded]);

  const lineById = new Map(lines.map((line) => [line.id, line]));
  const linesLoaded = items.length === 0 || loadedCartKey === JSON.stringify(items);
  const availableLines = lines.filter((line) => line.available);
  const total = availableLines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const availableCount = availableLines.reduce((sum, line) => sum + line.quantity, 0);
  const whatsappNumber = (settings.whatsapp_number || '').replace(/\D/g, '');
  const fallbackUrl = `https://wa.me/${whatsappNumber}`;

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleCheckout = async (event) => {
    event.preventDefault();
    setError('');
    if (!isEgyptianMobile(form.phone)) {
      setError('أدخل رقم موبايل مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.');
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await createOrder({ data: items.map(({ id, quantity }) => ({ id, quantity })) });
      const orderItems = order.items.map((line) => ({
        name: line.name,
        quantity: line.quantity,
        lineTotal: line.lineTotal ?? line.unitPrice * line.quantity,
      }));
      const message = buildOrderMessage({
        code: order.code,
        customer: { ...form, phone: normalizeEgyptianMobile(form.phone) },
        items: orderItems,
        total: order.total,
      });
      clearCart();
      window.location.assign(`${fallbackUrl}?text=${encodeURIComponent(message)}`);
    } catch {
      setError('تعذر تسجيل طلبك الآن. حاول مرة أخرى أو أرسل طلبك مباشرة عبر واتساب.');
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page">
      <div className="container">
        <header className="page-head">
          <h1>سلة التسوق</h1>
          {hasLoaded && items.length > 0 && <p>راجع الكميات، ثم اكتب بيانات التوصيل وأكد الطلب على واتساب.</p>}
        </header>
        {!hasLoaded || !linesLoaded ? (
          <div className="cart-loading" role="status" aria-live="polite">جارٍ تحديث سلة التسوق…</div>
        ) : items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true"><ShoppingCart weight="duotone" /></div>
            <h3>سلة التسوق فارغة</h3>
            <p>لم تقم بإضافة أي منتجات بعد. تصفح الأقسام واختر ما يناسبك.</p>
            <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>متابعة التسوق</Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-items">
              <div className="cart-items-head">
                <span>المنتجات ({itemCount})</span>
                <button type="button" className="cart-clear" onClick={clearCart}>تفريغ السلة</button>
              </div>
              {items.map((item) => {
                const line = lineById.get(item.id);
                if (!line) return null;
                return (
                  <div className={`cart-item${line.available ? '' : ' unavailable'}`} key={item.id}>
                    {line.available ? (
                      <Link to={`/product/${item.id}`} className="cart-item-image"><img src={line.image} alt={line.name} /></Link>
                    ) : <div className="cart-item-image unavailable-image" aria-hidden="true"><ShoppingCart /></div>}
                    <div className="cart-item-info">
                      {line.available ? <Link to={`/product/${item.id}`} className="cart-item-name">{line.name}</Link> : <span className="cart-item-name">{line.name}</span>}
                      {line.available ? <p className="cart-item-unit">{formatEGP(line.price)} / {line.unit}</p> : <p className="cart-item-unavailable">هذا المنتج غير متوفر ولن يضاف إلى الطلب.</p>}
                      <div className="cart-item-controls">
                        {line.available && <div className="qty-control">
                          <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="تقليل الكمية"><Minus weight="bold" /></button>
                          <input type="number" min="1" step="1" value={item.quantity} onChange={(event) => {
                            const quantity = Number(event.target.value);
                            updateQty(item.id, Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1);
                          }} aria-label={`كمية ${line.name}`} />
                          <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="زيادة الكمية"><Plus weight="bold" /></button>
                        </div>}
                        <button type="button" className="cart-remove" onClick={() => removeItem(item.id)}><Trash aria-hidden="true" />حذف</button>
                      </div>
                    </div>
                    {line.available && <div className="cart-item-total"><span className="price">{formatEGP(line.price * item.quantity)}</span></div>}
                  </div>
                );
              })}

              <form id="checkout" className="checkout-form" onSubmit={handleCheckout}>
                <h2>بيانات التوصيل</h2>
                <p className="checkout-privacy">تُحفظ بياناتك على هذا الجهاز وتُرسل إلى المتجر داخل رسالة واتساب فقط.</p>
                <div className="checkout-fields">
                  <label>الاسم<input name="name" autoComplete="name" required value={form.name} onChange={updateField} /></label>
                  <label>رقم الموبايل<input name="phone" type="tel" inputMode="tel" autoComplete="tel-national" required value={form.phone} onChange={updateField} aria-describedby="phone-hint" /><span id="phone-hint">مثال: 01012345678</span></label>
                  <label>المنطقة<select name="area" required value={form.area} onChange={updateField}><option value="">اختر المنطقة</option>{(settings.delivery_areas || []).map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
                  <label className="checkout-address">العنوان<input name="address" autoComplete="street-address" required value={form.address} onChange={updateField} /></label>
                  <label className="checkout-address">ملاحظات اختيارية<textarea name="notes" rows="3" value={form.notes} onChange={updateField} /></label>
                </div>
                {!settings.delivery_areas?.length && <p className="checkout-hint">لم تُضف مناطق التوصيل بعد. <a href={fallbackUrl}>تواصل معنا عبر واتساب</a> لتحديد منطقتك.</p>}
                {error && <div className="checkout-error" role="alert"><p>{error}</p><a href={fallbackUrl}>تواصل معنا عبر واتساب</a></div>}
                <button type="submit" className="btn btn-primary whatsapp-btn" disabled={isSubmitting || !formLoaded || !availableCount || !settings.delivery_areas?.length}>
                  <WhatsappLogo weight="bold" aria-hidden="true" />
                  {isSubmitting ? 'جارٍ تسجيل الطلب…' : 'تأكيد الطلب عبر واتساب'}
                </button>
              </form>
            </div>

            <aside className="cart-summary">
              <h2>ملخص الطلب</h2>
              <div className="summary-row"><span>عدد القطع المتاحة</span><span>{availableCount}</span></div>
              <div className="summary-row summary-total"><span>الإجمالي بدون التوصيل</span><span className="price">{formatEGP(total)}</span></div>
              <p className="summary-note">يُتفق على تكلفة التوصيل عبر المحادثة.</p>
              <Link to="/" className="btn btn-ghost" style={{ width: '100%' }}>متابعة التسوق</Link>
            </aside>
            <div className="cart-checkout-bar">
              <div><span>الإجمالي بدون التوصيل</span><strong className="price">{formatEGP(total)}</strong></div>
              <a href="#checkout" className="btn btn-primary whatsapp-btn">تابع لإتمام الطلب</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
