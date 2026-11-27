import { useEffect, useRef, useState } from 'react';
import { Link, useLoaderData } from '@tanstack/react-router';
import { Minus, Plus, ShoppingCart, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { getCurrentCartLines, getTurnstileSiteKey, createOrder } from '../data/orders';
import { useCart } from '../context/useCart';
import { formatEGP } from '../utils/format';
import { buildOrderMessage, isEgyptianMobile, normalizeEgyptianMobile } from '../checkout/whatsappOrder';
import { Route as RootRoute } from '../routes/__root';
import { MAX_ITEM_QUANTITY } from '../checkout/cartLimits';
import './CartPage.css';

const CHECKOUT_STORAGE_KEY = 'iman-checkout';
const CHECKOUT_ID_KEY = 'iman-checkout-id';
// A retry of the same cart reuses its id so a lost response cannot create a second order;
// an edited cart gets a new id so it never returns the earlier order's items.
function getCheckoutId(items) {
  const cartKey = JSON.stringify(items.map(({ id, quantity }) => ({ id, quantity })));
  let saved = null;
  try { saved = JSON.parse(localStorage.getItem(CHECKOUT_ID_KEY) ?? 'null'); } catch { saved = null; }
  const id = saved?.cartKey === cartKey && typeof saved.id === 'string' ? saved.id : crypto.randomUUID();
  localStorage.setItem(CHECKOUT_ID_KEY, JSON.stringify({ id, cartKey }));
  return id;
}

const EMPTY_FORM ={ name: '', phone: '', area: '', address: '', notes: '' };
const CHECKOUT_FAILURE_MESSAGE = 'تعذّر إرسال طلبك الآن. حاول مرة أخرى بعد قليل، أو أرسل طلبك مباشرة عبر واتساب.';

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
  const [hasPendingCheckout, setHasPendingCheckout] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [refreshError, setRefreshError] = useState(false);
  const [notice, setNotice] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [turnstileReady, setTurnstileReady] = useState(false);
  const [turnstileFailed, setTurnstileFailed] = useState(false);
  const [turnstileLoadFailed, setTurnstileLoadFailed] = useState(false);
  const turnstileContainer = useRef(null);
  const turnstileId = useRef(null);
  const pendingToken = useRef(null);
  const refreshRequest = useRef(0);

  useEffect(() => {
    if (!hasLoaded) return;
    if (items.length === 0) return undefined;
    let isCurrent = true;
    const request = ++refreshRequest.current;
    const cartKey = JSON.stringify(items);
    getCurrentCartLines({ data: items }).then((currentLines) => {
      if (isCurrent && request === refreshRequest.current) {
        setLines(currentLines);
        setLoadedCartKey(cartKey);
        setRefreshError(false);
      }
    }).catch(() => {
      if (isCurrent && request === refreshRequest.current) {
        setRefreshError(true);
        setLoadedCartKey(cartKey);
      }
    });
    return () => { isCurrent = false; };
  }, [hasLoaded, items, refreshVersion]);

  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setRefreshVersion((value) => value + 1); };
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.removeEventListener('focus', refresh); document.removeEventListener('visibilitychange', refresh); };
  }, []);

  // Restore browser-only checkout values after hydration to keep server markup stable.
  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect
    setForm(loadCheckoutForm());
    // oxlint-disable-next-line react/set-state-in-effect
    setHasPendingCheckout(Boolean(localStorage.getItem(CHECKOUT_ID_KEY)));
    // oxlint-disable-next-line react/set-state-in-effect
    setFormLoaded(true);
  }, []);

  useEffect(() => {
    if (formLoaded) localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(form));
  }, [form, formLoaded]);

  const hasItems = items.length > 0;
  const hasLoadedLines = loadedCartKey !== null;
  const linesLoaded = !hasItems || loadedCartKey === JSON.stringify(items);

  useEffect(() => {
    if (!hasLoaded || !hasItems || !hasLoadedLines) return undefined;
    let isCurrent = true;
    const renderWidget = (sitekey) => {
      if (!isCurrent) return;
      if (!sitekey || !window.turnstile || !turnstileContainer.current) {
        if (isCurrent) setTurnstileLoadFailed(true);
        return;
      }
      turnstileId.current = window.turnstile.render(turnstileContainer.current, {
        sitekey,
        execution: 'execute',
        appearance: 'interaction-only',
        callback: (token) => {
          if (isCurrent) setTurnstileFailed(false);
          pendingToken.current?.resolve(token);
          pendingToken.current = null;
        },
        'error-callback': () => {
          pendingToken.current?.reject(new Error('Turnstile widget reported an error'));
          pendingToken.current = null;
          if (isCurrent) setTurnstileFailed(true);
        },
        'expired-callback': () => {
          pendingToken.current?.reject(new Error('Turnstile token expired'));
          pendingToken.current = null;
        },
      });
      if (isCurrent) setTurnstileReady(true);
    };
    const onError = () => { if (isCurrent) setTurnstileLoadFailed(true); };

    getTurnstileSiteKey().then((sitekey) => {
      if (!sitekey) throw new Error('TURNSTILE_SITE_KEY is not configured');
      if (window.turnstile) {
        renderWidget(sitekey);
        return;
      }
      let script = document.querySelector('script[data-turnstile]');
      const shouldAppend = !script;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        script.dataset.turnstile = 'true';
      }
      script.addEventListener('load', () => renderWidget(sitekey), { once: true });
      script.addEventListener('error', onError, { once: true });
      if (shouldAppend) document.head.appendChild(script);
      if (window.turnstile) renderWidget(sitekey);
    }).catch(onError);

    return () => {
      isCurrent = false;
      if (turnstileId.current != null && window.turnstile) window.turnstile.remove(turnstileId.current);
      turnstileId.current = null;
      setTurnstileReady(false);
      setTurnstileFailed(false);
      setTurnstileLoadFailed(false);
      pendingToken.current?.reject(new Error('Checkout closed'));
      pendingToken.current = null;
    };
  }, [hasLoaded, hasItems, hasLoadedLines]);

  const lineById = new Map(lines.map((line) => [line.id, line]));
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
      let currentLines;
      try {
        refreshRequest.current += 1;
        currentLines = await getCurrentCartLines({ data: items });
      } catch {
        setRefreshError(true);
        setIsSubmitting(false);
        return;
      }
      setRefreshError(false);
      setLines(currentLines);
      setLoadedCartKey(JSON.stringify(items));
      if (currentLines.length !== lines.length || currentLines.some((line) => {
        const previous = lines.find((item) => item.id === line.id);
        return !previous || previous.price !== line.price || previous.available !== line.available;
      })) {
        setNotice('تغيرت أسعار بعض المنتجات أو حالة توفرها. راجع الإجمالي ثم أكد الطلب مجددًا.');
        setIsSubmitting(false);
        return;
      }
      setNotice('');
      if (!turnstileReady || turnstileLoadFailed || turnstileId.current == null || !window.turnstile) {
        throw new Error('Turnstile is not ready');
      }
      if (turnstileFailed) setTurnstileFailed(false);
      const token = await new Promise((resolve, reject) => {
        const timeout = window.setTimeout(() => {
          pendingToken.current = null;
          reject(new Error('Turnstile challenge timed out'));
        }, 15_000);
        pendingToken.current = {
          resolve: (value) => { window.clearTimeout(timeout); resolve(value); },
          reject: (reason) => { window.clearTimeout(timeout); reject(reason); },
        };
        window.turnstile.reset(turnstileId.current);
        window.turnstile.execute(turnstileId.current);
      });
      const checkoutId = getCheckoutId(items);
      setHasPendingCheckout(true);
      const order = await createOrder({ data: {
        items: items.map(({ id, quantity }) => ({ id, quantity })),
        turnstileToken: token,
        checkoutId,
      } });
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
      localStorage.removeItem(CHECKOUT_ID_KEY);
      setHasPendingCheckout(false);
      window.location.assign(`${fallbackUrl}?text=${encodeURIComponent(message)}`);
    } catch {
      setError(CHECKOUT_FAILURE_MESSAGE);
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
        {!hasLoaded || (hasItems && !hasLoadedLines) ? (
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
                const line = lineById.get(item.id) ?? { id: item.id, name: 'منتج غير متاح', available: false };
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
                          <input type="number" min="1" max={MAX_ITEM_QUANTITY} step="1" value={item.quantity} onChange={(event) => {
                            const quantity = Number(event.target.value);
                            updateQty(item.id, Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1);
                          }} aria-label={`كمية ${line.name}`} />
                          <button type="button" disabled={item.quantity >= MAX_ITEM_QUANTITY} onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="زيادة الكمية"><Plus weight="bold" /></button>
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
                  <label htmlFor="checkout-name">الاسم<input id="checkout-name" name="name" autoComplete="name" required value={form.name} onChange={updateField} /></label>
                  <label htmlFor="checkout-phone">رقم الموبايل<input id="checkout-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" dir="ltr" required value={form.phone} onChange={updateField} aria-describedby="phone-hint" /><span id="phone-hint">مثال: <bdi dir="ltr">01012345678</bdi></span></label>
                  <label htmlFor="checkout-area">المنطقة<select id="checkout-area" name="area" required value={form.area} onChange={updateField}><option value="">اختر المنطقة</option>{(settings.delivery_areas || []).map((area) => <option key={area} value={area}>{area}</option>)}</select></label>
                  <label className="checkout-address" htmlFor="checkout-address">العنوان<input id="checkout-address" name="address" autoComplete="street-address" required value={form.address} onChange={updateField} /></label>
                  <label className="checkout-address" htmlFor="checkout-notes">ملاحظات اختيارية<textarea id="checkout-notes" name="notes" rows="3" value={form.notes} onChange={updateField} /></label>
                </div>
                <div className="turnstile-widget" ref={turnstileContainer} />
                {refreshError && <div className="checkout-error" role="alert"><p>تعذر تحديث أسعار المنتجات. حاول مجددًا.</p><button type="button" onClick={() => setRefreshVersion((value) => value + 1)}>إعادة المحاولة</button></div>}
                {notice && <p className="checkout-hint" role="status">{notice}</p>}
                {!settings.delivery_areas?.length && <p className="checkout-hint">لم تُضف مناطق التوصيل بعد. <a href={fallbackUrl}>تواصل معنا عبر واتساب</a> لتحديد منطقتك.</p>}
                {error && <div className="checkout-error" role="alert"><p>{error}</p><a href={fallbackUrl}>تواصل معنا عبر واتساب</a></div>}
                {turnstileLoadFailed && !error && <div className="checkout-error" role="alert"><p>{CHECKOUT_FAILURE_MESSAGE}</p><a href={fallbackUrl}>تواصل معنا عبر واتساب</a></div>}
                <button type="submit" className="btn btn-primary whatsapp-btn" disabled={isSubmitting || refreshError || !formLoaded || !linesLoaded || (!availableCount && !hasPendingCheckout) || !settings.delivery_areas?.length || !turnstileReady || turnstileLoadFailed}>
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
