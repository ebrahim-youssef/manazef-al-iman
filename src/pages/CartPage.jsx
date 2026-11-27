import shared from '../Storefront.module.css'
import { useEffect, useRef, useState } from 'react';
import { Link, useLoaderData } from '@tanstack/react-router';
import { Minus, Plus, ShoppingCart, Trash, WhatsappLogo } from '@phosphor-icons/react';
import { Button, Select, Textarea, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { getCurrentCartLines, getTurnstileSiteKey, createOrder } from '../data/orders';
import { useCart } from '../context/useCart';
import { formatEGP } from '../utils/format';
import { buildOrderMessage, isEgyptianMobile, normalizeEgyptianMobile } from '../checkout/whatsappOrder';
import { Route as RootRoute } from '../routes/__root';
import { MAX_ITEM_QUANTITY } from '../checkout/cartLimits';
import styles from './CartPage.module.css';

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
  const form = useForm({
    initialValues: EMPTY_FORM,
    validate: {
      phone: (value) => isEgyptianMobile(value) ? null : 'أدخل رقم موبايل مصري صحيح يبدأ بـ 010 أو 011 أو 012 أو 015.',
      area: (value) => settings.delivery_areas?.includes(value) ? null : 'اختر المنطقة.',
    },
  });
  const setFormValues = form.setValues;
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
    setFormValues(loadCheckoutForm());
    // oxlint-disable-next-line react/set-state-in-effect
    setHasPendingCheckout(Boolean(localStorage.getItem(CHECKOUT_ID_KEY)));
    // oxlint-disable-next-line react/set-state-in-effect
    setFormLoaded(true);
  }, [setFormValues]);

  useEffect(() => {
    if (formLoaded) localStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(form.values));
  }, [form.values, formLoaded]);

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

  const handleCheckout = async (values) => {
    setError('');
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
        customer: { ...values, phone: normalizeEgyptianMobile(values.phone) },
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
    <section className={shared['page']}>
      <div className={shared['container']}>
        <header className={shared['page-head']}>
          <h1>سلة التسوق</h1>
          {hasLoaded && items.length > 0 && <p>راجع الكميات، ثم اكتب بيانات التوصيل وأكد الطلب على واتساب.</p>}
        </header>
        {!hasLoaded || (hasItems && !hasLoadedLines) ? (
          <div className={styles['cart-loading']} role="status" aria-live="polite">جارٍ تحديث سلة التسوق…</div>
        ) : items.length === 0 ? (
          <div className={shared['empty-state']}>
            <div className={shared['empty-icon']} aria-hidden="true"><ShoppingCart weight="duotone" /></div>
            <h3>سلة التسوق فارغة</h3>
            <p>لم تقم بإضافة أي منتجات بعد. تصفح الأقسام واختر ما يناسبك.</p>
            <Link to="/" className={[shared['btn'], shared['btn-primary']].join(' ')} style={{ marginTop: 16 }}>متابعة التسوق</Link>
          </div>
        ) : (
          <div className={styles['cart-layout']}>
            <div className={styles['cart-items']}>
              <div className={styles['cart-items-head']}>
                <span>المنتجات ({itemCount})</span>
                <Button type="button" unstyled className={styles['cart-clear']} onClick={clearCart}>تفريغ السلة</Button>
              </div>
              {items.map((item) => {
                const line = lineById.get(item.id) ?? { id: item.id, name: 'منتج غير متاح', available: false };
                return (
                  <div className={`${styles['cart-item']}${line.available ? '' : ` ${styles.unavailable}`}`} key={item.id}>
                    {line.available ? (
                      <Link to={`/product/${item.id}`} className={styles['cart-item-image']}><img src={line.image} alt={line.name} /></Link>
                    ) : <div className={[styles['cart-item-image'], styles['unavailable-image']].join(' ')} aria-hidden="true"><ShoppingCart /></div>}
                    <div className={styles['cart-item-info']}>
                      {line.available ? <Link to={`/product/${item.id}`} className={styles['cart-item-name']}>{line.name}</Link> : <span className={styles['cart-item-name']}>{line.name}</span>}
                      {line.available ? <p className={styles['cart-item-unit']}>{formatEGP(line.price)}</p> : <p className={styles['cart-item-unavailable']}>هذا المنتج غير متوفر ولن يضاف إلى الطلب.</p>}
                      <div className={styles['cart-item-controls']}>
                        {line.available && <div className={styles['qty-control']}>
                          <Button type="button" unstyled onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="تقليل الكمية"><Minus weight="bold" /></Button>
                          <input type="number" min="1" max={MAX_ITEM_QUANTITY} step="1" value={item.quantity} onChange={(event) => {
                            const quantity = Number(event.target.value);
                            updateQty(item.id, Number.isFinite(quantity) ? Math.max(1, Math.floor(quantity)) : 1);
                          }} aria-label={`كمية ${line.name}`} />
                          <Button type="button" unstyled disabled={item.quantity >= MAX_ITEM_QUANTITY} onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="زيادة الكمية"><Plus weight="bold" /></Button>
                        </div>}
                        <Button type="button" unstyled className={styles['cart-remove']} onClick={() => removeItem(item.id)}><Trash aria-hidden="true" />حذف</Button>
                      </div>
                    </div>
                    {line.available && <div className={styles['cart-item-total']}><span className={shared['price']}>{formatEGP(line.price * item.quantity)}</span></div>}
                  </div>
                );
              })}

              <form id="checkout" className={styles['checkout-form']} onSubmit={form.onSubmit(handleCheckout)}>
                <h2>بيانات التوصيل</h2>
                <p className={styles['checkout-privacy']}>تُحفظ بياناتك على هذا الجهاز وتُرسل إلى المتجر داخل رسالة واتساب فقط.</p>
                <div className={styles['checkout-fields']}>
                  <TextInput id="checkout-name" name="name" label="الاسم" autoComplete="name" required withAsterisk={false} {...form.getInputProps('name')} />
                  <TextInput id="checkout-phone" name="phone" label="رقم الموبايل" type="tel" inputMode="tel" autoComplete="tel-national" attributes={{ input: { dir: 'ltr' } }} required withAsterisk={false} description={<>مثال: <bdi dir="ltr">01012345678</bdi></>} {...form.getInputProps('phone')} />
                  <Select id="checkout-area" name="area" label="المنطقة" placeholder="اختر المنطقة" required withAsterisk={false} data={settings.delivery_areas || []} {...form.getInputProps('area')} />
                  <TextInput className={styles['checkout-address']} id="checkout-address" name="address" label="العنوان" autoComplete="street-address" required withAsterisk={false} {...form.getInputProps('address')} />
                  <Textarea className={styles['checkout-address']} id="checkout-notes" name="notes" label="ملاحظات اختيارية" rows={3} {...form.getInputProps('notes')} />
                </div>
                <div ref={turnstileContainer} />
                {refreshError && <div className={styles['checkout-error']} role="alert"><p>تعذر تحديث أسعار المنتجات. حاول مجددًا.</p><button type="button" onClick={() => setRefreshVersion((value) => value + 1)}>إعادة المحاولة</button></div>}
                {notice && <p className={styles['checkout-hint']} role="status">{notice}</p>}
                {!settings.delivery_areas?.length && <p className={styles['checkout-hint']}>لم تُضف مناطق التوصيل بعد. <a href={fallbackUrl}>تواصل معنا عبر واتساب</a> لتحديد منطقتك.</p>}
                {error && <div className={styles['checkout-error']} role="alert"><p>{error}</p><a href={fallbackUrl}>تواصل معنا عبر واتساب</a></div>}
                {turnstileLoadFailed && !error && <div className={styles['checkout-error']} role="alert"><p>{CHECKOUT_FAILURE_MESSAGE}</p><a href={fallbackUrl}>تواصل معنا عبر واتساب</a></div>}
                <Button type="submit" className={[shared['btn'], shared['btn-primary'], styles['whatsapp-btn']].join(' ')} disabled={isSubmitting || refreshError || !formLoaded || !linesLoaded || (!availableCount && !hasPendingCheckout) || !settings.delivery_areas?.length || !turnstileReady || turnstileLoadFailed}>
                  <WhatsappLogo weight="bold" aria-hidden="true" />
                  {isSubmitting ? 'جارٍ تسجيل الطلب…' : 'تأكيد الطلب عبر واتساب'}
                </Button>
              </form>
            </div>

            <aside className={styles['cart-summary']}>
              <h2>ملخص الطلب</h2>
              <div className={styles['summary-row']}><span>عدد القطع المتاحة</span><span>{availableCount}</span></div>
              <div className={[styles['summary-row'], styles['summary-total']].join(' ')}><span>الإجمالي بدون التوصيل</span><span className={shared['price']}>{formatEGP(total)}</span></div>
              <p className={styles['summary-note']}>يُتفق على تكلفة التوصيل عبر المحادثة.</p>
              <Link to="/" className={[shared['btn'], shared['btn-ghost']].join(' ')} style={{ width: '100%' }}>متابعة التسوق</Link>
            </aside>
            <div className={styles['cart-checkout-bar']}>
              <div><span>الإجمالي بدون التوصيل</span><strong className={shared['price']}>{formatEGP(total)}</strong></div>
              <a href="#checkout" className={[shared['btn'], shared['btn-primary'], styles['whatsapp-btn']].join(' ')}>تابع لإتمام الطلب</a>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
