import { Box, UnstyledButton } from '@mantine/core';
import { useMemo, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Route } from '../routes/product.$id';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import { useCart } from '../context/useCart';
import { MAX_CART_ITEMS, MAX_ITEM_QUANTITY } from '../checkout/cartLimits';
import { formatEGP } from '../utils/format';
import { getDiscountPercent } from '../utils/discount';
import { Minus, Package, Plus, ShoppingCart } from '@phosphor-icons/react';
import ProductGrid from '../components/ProductGrid';
import styles from './ProductDetails.module.css';

const EMPTY_PRODUCTS = [];
const EMPTY_CATEGORIES = [];

export default function ProductDetails() {
  const catalog = Route.useLoaderData();
  const products = catalog.unavailable ? EMPTY_PRODUCTS : catalog.products;
  const categories = catalog.unavailable ? EMPTY_CATEGORIES : catalog.categories;
  const { id } = useParams({ from: '/product/$id' });
  const product = products.find((p) => p.id === id);
  const { addItem, items } = useCart();
  const [limitReached, setLimitReached] = useState(false);
  const [qty, setQty] = useState(1);

  const related = useMemo(() => {
    if (!product) return [];
    return products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);
  }, [product, products]);

  if (catalog.unavailable) return <CatalogUnavailable />;
  if (!product) {
    return (
      <Box className="container section">
        <Box className="empty-state">
          <Box className="empty-icon" aria-hidden="true"><Package weight="duotone" /></Box>
          <h3>المنتج غير موجود</h3>
          <p>قد يكون المنتج تم حذفه أو الرابط غير صحيح.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>العودة للرئيسية</Link>
        </Box>
      </Box>
    );
  }

  const category = categories.find((c) => c.id === product.category);
  const discount = getDiscountPercent(product);

  const handleAdd = () => {
    if (!product.available) return;
    if (items.length >= MAX_CART_ITEMS && !items.some((item) => item.id === product.id)) { setLimitReached(true); return; }
    setLimitReached(false);
    addItem(product, qty);
  };

  return (
    <>
      <section className="page">
        <Box className="container">
          <nav className="breadcrumb" aria-label="مسار التنقل">
            <Link to="/">الرئيسية</Link>
            {category && <><span aria-hidden="true">/</span><Link to={`/category/${category.slug}`}>{category.name}</Link></>}
          </nav>
          <Box className={styles['product-details']}>
            <Box className={styles['product-details-image']}>
              <img src={product.detailImage} alt={product.name} />
              {discount > 0 && <span className={'badge' + ' ' + 'badge-discount' + ' ' + styles['detail-badge']}>خصم {discount}%</span>}
            </Box>
            <Box className={styles['product-details-info']}>
              <p className={styles['detail-brand']}>{product.brand}</p>
              <h1>{product.name}</h1>
              <Box className={styles['detail-pricing']}>
                <span className={styles['detail-price'] + ' ' + 'price'}>{formatEGP(product.price)}</span>
                {product.originalPrice ? <span className={styles['detail-old'] + ' ' + 'price'}>{formatEGP(product.originalPrice)}</span> : null}
              </Box>
              {product.fridayPrice !== null && !product.isFridayActive && (
                <p className={styles['detail-friday-price']}>الجمعة بـ {formatEGP(product.fridayPrice)}</p>
              )}
              {product.unitType === 'wholesale' && <p className={styles['detail-unit']}>السعر للكرتونة كاملة</p>}
              {product.cartonSize ? (
                <p className={styles['detail-unit']}>محتوى الكرتونة: <strong>{product.cartonSize} عبوة</strong></p>
              ) : null}
              <p className={styles['detail-availability'] + ' ' + (product.available ? styles.ok : styles.no)}>
                {product.available ? 'متوفر في المخزون' : 'غير متوفر حاليًا'}
              </p>
              <p className={styles['detail-desc']}>{product.description}</p>

              <Box className={styles['detail-actions']}>
                <Box className={styles['qty-control']} aria-label="تحديد الكمية">
                  <UnstyledButton type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="تقليل الكمية"><Minus weight="bold" /></UnstyledButton>
                  <input
                    type="number"
                    min="1"
                    max={MAX_ITEM_QUANTITY}
                    value={qty}
                    onChange={(e) => setQty(Math.min(MAX_ITEM_QUANTITY, Math.max(1, Math.floor(Number(e.target.value)) || 1)))}
                    aria-label="الكمية"
                  />
                  <UnstyledButton type="button" disabled={qty >= MAX_ITEM_QUANTITY} onClick={() => setQty((q) => q + 1)} aria-label="زيادة الكمية"><Plus weight="bold" /></UnstyledButton>
                </Box>
                {limitReached && <p role="status">احذف منتجًا من السلة لإضافة منتج آخر.</p>}
                <UnstyledButton type="button" className={'btn' + ' ' + 'btn-primary' + ' ' + styles['detail-add']} onClick={handleAdd} disabled={!product.available}>
                  {product.available && <ShoppingCart weight="bold" aria-hidden="true" />}
                  {product.available ? 'أضف إلى السلة' : 'غير متوفر'}
                </UnstyledButton>
              </Box>
            </Box>
          </Box>

          {related.length > 0 && (
            <Box className={styles['related-section']}>
              <Box className="section-header">
                <Box>
                  <h2 className="section-title">منتجات ذات صلة</h2>
                  <p className="section-subtitle">منتجات أخرى قد تهمك من نفس القسم.</p>
                </Box>
              </Box>
              <ProductGrid products={related} />
            </Box>
          )}
        </Box>
      </section>
    </>
  );
}
