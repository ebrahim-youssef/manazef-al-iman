import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { formatEGP } from '../utils/format';
import { buildWhatsAppUrl } from '../utils/whatsapp';
import './CartPage.css';

export default function CartPage() {
  const { items, total, itemCount, removeItem, updateQty, clearCart } = useCart();

  const handleWhatsApp = () => {
    if (!items.length) return;
    const url = buildWhatsAppUrl(items, total);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">الرئيسية</Link>
            <span>/</span>
            <span>سلة التسوق</span>
          </div>
          <h1>سلة التسوق</h1>
          <p>راجع منتجاتك وعدّل الكميات قبل إتمام الطلب عبر واتساب.</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          {!items.length ? (
            <div className="empty-state">
              <div className="empty-icon">🛒</div>
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
                  const lineTotal = item.price * item.quantity;
                  return (
                    <div className="cart-item" key={item.id}>
                      <Link to={`/product/${item.id}`} className="cart-item-image">
                        <img src={item.image} alt={item.name} />
                      </Link>
                      <div className="cart-item-info">
                        <Link to={`/product/${item.id}`} className="cart-item-name">{item.name}</Link>
                        <p className="cart-item-unit">{formatEGP(item.price)} / {item.unit}</p>
                        <div className="cart-item-controls">
                          <div className="qty-control">
                            <button type="button" onClick={() => updateQty(item.id, item.quantity - 1)} aria-label="تقليل الكمية">−</button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateQty(item.id, Math.max(1, Number(e.target.value) || 1))}
                              aria-label={`كمية ${item.name}`}
                            />
                            <button type="button" onClick={() => updateQty(item.id, item.quantity + 1)} aria-label="زيادة الكمية">+</button>
                          </div>
                          <button type="button" className="cart-remove" onClick={() => removeItem(item.id)}>حذف</button>
                        </div>
                      </div>
                      <div className="cart-item-total">
                        <span>{formatEGP(lineTotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <aside className="cart-summary">
                <h2>ملخص الطلب</h2>
                <div className="summary-row">
                  <span>عدد الأصناف</span>
                  <span>{items.length}</span>
                </div>
                <div className="summary-row">
                  <span>إجمالي القطع</span>
                  <span>{itemCount}</span>
                </div>
                <div className="summary-row summary-total">
                  <span>الإجمالي</span>
                  <span>{formatEGP(total)}</span>
                </div>
                <p className="summary-note">* تكلفة التوصيل يتم تأكيدها عبر واتساب حسب المنطقة.</p>
                <button type="button" className="btn btn-primary whatsapp-btn" onClick={handleWhatsApp}>
                  إتمام الطلب عبر واتساب
                </button>
                <Link to="/" className="btn btn-ghost" style={{ width: '100%' }}>متابعة التسوق</Link>
              </aside>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
