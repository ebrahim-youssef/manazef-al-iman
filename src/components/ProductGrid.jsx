import { Box } from '@mantine/core';
import { Basket } from '@phosphor-icons/react';
import ProductCard from './ProductCard';
import styles from './ProductGrid.module.css';

export default function ProductGrid({ products, emptyMessage = 'لا توجد منتجات مطابقة.' }) {
  if (!products.length) {
    return (
      <Box className="empty-state">
        <Box className="empty-icon" aria-hidden="true"><Basket weight="duotone" /></Box>
        <h3>لا توجد منتجات</h3>
        <p>{emptyMessage}</p>
      </Box>
    );
  }

  return (
    <Box className={styles['product-grid']}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </Box>
  );
}
