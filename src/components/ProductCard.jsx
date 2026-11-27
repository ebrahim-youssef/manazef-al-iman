import { Box, UnstyledButton } from '@mantine/core';
import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { Check } from '@phosphor-icons/react';
import { useCart } from '../context/useCart';
import { MAX_CART_ITEMS } from '../checkout/cartLimits';
import { formatEGP } from '../utils/format';
import { getDiscountPercent } from '../utils/discount';
import styles from './ProductCard.module.css';

const ADDED_FEEDBACK_MS = 1500;

export default function ProductCard({ product }) {
  const { addItem, items } = useCart();
  const [limitReached, setLimitReached] = useState(false);
  const discount = getDiscountPercent(product);
  const [isJustAdded, setIsJustAdded] = useState(false);

  useEffect(() => {
    if (!isJustAdded) return undefined;
    const timer = setTimeout(() => setIsJustAdded(false), ADDED_FEEDBACK_MS);
    return () => clearTimeout(timer);
  }, [isJustAdded]);

  const handleAdd = () => {
    if (items.length >= MAX_CART_ITEMS && !items.some((item) => item.id === product.id)) { setLimitReached(true); return; }
    setLimitReached(false);
    addItem(product, 1);
    setIsJustAdded(true);
  };

  const buttonLabel = !product.available ? 'غير متوفر' : isJustAdded ? 'تمت الإضافة' : 'أضف للسلة';

  return (
    <article className={styles['product-card']}>
      <Link to={`/product/${product.id}`} className={styles['product-card-image-wrap']}>
        <img src={product.image} alt={product.name} className={styles['product-card-image']} loading="lazy" />
        {discount > 0 && <span className={'badge' + ' ' + 'badge-discount' + ' ' + styles['product-card-badge']}>خصم {discount}%</span>}
        {!product.available && <span className={'badge' + ' ' + 'badge-out' + ' ' + styles['product-card-badge']}>غير متوفر</span>}
      </Link>
      <Box className={styles['product-card-body']}>
        <p className={styles['product-card-brand']}>{product.brand}</p>
        <Link to={`/product/${product.id}`} className={styles['product-card-name']}>
          <h3>{product.name}</h3>
        </Link>
        <Box className={styles['product-card-pricing']}>
          <span className={styles['product-card-price'] + ' ' + 'price'}>{formatEGP(product.price)}</span>
          {product.originalPrice ? (
            <span className={styles['product-card-old'] + ' ' + 'price'}>{formatEGP(product.originalPrice)}</span>
          ) : null}
        </Box>
        {product.fridayPrice !== null && !product.isFridayActive && (
          <p className={styles['product-card-friday-price']}>الجمعة بـ {formatEGP(product.fridayPrice)}</p>
        )}
        <UnstyledButton
          type="button"
          className={'btn btn-primary ' + styles['product-card-btn'] + (isJustAdded ? ' ' + styles['is-added'] : '')}
          onClick={handleAdd}
          disabled={!product.available}
          aria-live="polite"
        >
          {isJustAdded && <Check weight="bold" aria-hidden="true" />}
          {buttonLabel}
        </UnstyledButton>
        {limitReached && <p role="status">احذف منتجًا من السلة لإضافة منتج آخر.</p>}
      </Box>
    </article>
  );
}
