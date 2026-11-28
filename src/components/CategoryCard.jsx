import { Box } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import styles from './CategoryCard.module.css';

export default function CategoryCard({ category, productCount }) {
  return (
    <Link to={`/category/${category.slug}`} className={styles['category-card']}>
      <Box className={styles['category-card-image']}>
        {category.image && <img src={category.image} alt="" loading="lazy" />}
      </Box>
      <Box className={styles['category-card-body']}>
        <h3>{category.name}</h3>
        <span>{productCount} منتج</span>
      </Box>
    </Link>
  );
}
