import shared from '../Storefront.module.css'
import { Box, UnstyledButton } from '@mantine/core';
import { MagnifyingGlass } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import ProductGrid from '../components/ProductGrid';
import { Route } from '../routes/category.$slug';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import styles from './CategoryPage.module.css';

const ALL_BRANDS = 'all';

const sortOptions = [
  { value: 'default', label: 'الترتيب: المقترح' },
  { value: 'price-asc', label: 'الأقل سعرًا' },
  { value: 'price-desc', label: 'الأعلى سعرًا' },
  { value: 'best', label: 'الأكثر مبيعًا' },
  { value: 'newest', label: 'الأحدث' },
];

function sortProducts(list, sort) {
  const sorted = [...list];
  if (sort === 'price-asc') sorted.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') sorted.sort((a, b) => b.price - a.price);
  if (sort === 'best') sorted.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
  if (sort === 'newest') sorted.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return sorted;
}

export default function CategoryPage() {
  const catalog = Route.useLoaderData();
  const { slug } = useParams({ from: '/category/$slug' });
  // Keying on the slug resets every filter when the shopper switches category.
  if (catalog.unavailable) return <CatalogUnavailable />;
  return <CategoryListing key={slug} slug={slug} categories={catalog.categories} products={catalog.products} />;
}

function CategoryListing({ slug, categories, products }) {
  const category = categories.find((c) => c.slug === slug);
  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState(ALL_BRANDS);
  const [sort, setSort] = useState('default');

  const baseProducts = useMemo(() => {
    if (slug === 'offers') return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
    if (!category) return [];
    return products.filter((p) => p.category === category.id);
  }, [slug, category, products]);

  const brands = useMemo(() => [...new Set(baseProducts.map((p) => p.brand))].sort(), [baseProducts]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const matches = baseProducts.filter((p) => {
      if (brand !== ALL_BRANDS && p.brand !== brand) return false;
      if (!term) return true;
      return p.name.toLowerCase().includes(term) || p.brand.toLowerCase().includes(term);
    });
    return sortProducts(matches, sort);
  }, [baseProducts, search, brand, sort]);

  const hasActiveFilters = search.trim() !== '' || brand !== ALL_BRANDS;
  const clearFilters = () => {
    setSearch('');
    setBrand(ALL_BRANDS);
  };

  if (!category) {
    return (
      <Box className={[shared['container'], shared['section']].join(' ')}>
        <Box className={shared['empty-state']}>
          <Box className={shared['empty-icon']} aria-hidden="true"><MagnifyingGlass weight="duotone" /></Box>
          <h3>القسم غير موجود</h3>
          <p>ارجع للرئيسية واختر قسمًا من القائمة.</p>
          <Link to="/" className={[shared['btn'], shared['btn-primary']].join(' ')} style={{ marginTop: 16 }}>العودة للرئيسية</Link>
        </Box>
      </Box>
    );
  }

  return (
    <section className={shared['page']}>
      <Box className={shared['container']}>
        <nav className={shared['breadcrumb']} aria-label="مسار التنقل">
          <Link to="/">الرئيسية</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{category.name}</span>
        </nav>
        <header className={shared['page-head']}>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </header>

        <Box className={styles['listing-toolbar']}>
          <label className={styles['listing-search']}>
            <MagnifyingGlass aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`ابحث في ${category.name}`}
              aria-label={`البحث في ${category.name}`}
            />
          </label>
          <select
            className={styles['listing-sort']}
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="ترتيب المنتجات"
          >
            {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </Box>

        {brands.length > 1 && (
          <Box className={styles['brand-chips']} role="group" aria-label="تصفية حسب الماركة">
            {[ALL_BRANDS, ...brands].map((b) => (
              <UnstyledButton
                key={b}
                type="button"
                  className={[styles.chip, brand === b ? styles.active : ''].join(' ')}
                aria-pressed={brand === b}
                onClick={() => setBrand(b)}
              >
                {b === ALL_BRANDS ? 'كل الماركات' : b}
              </UnstyledButton>
            ))}
          </Box>
        )}

        <Box className={styles['results-bar']}>
          <p aria-live="polite">{filtered.length} منتج</p>
          {hasActiveFilters && (
            <UnstyledButton type="button" className={styles['link-btn']} onClick={clearFilters}>مسح التصفية</UnstyledButton>
          )}
        </Box>

        <ProductGrid
          products={filtered}
          emptyMessage="جرّب كلمة أخرى أو اختر كل الماركات."
        />
      </Box>
    </section>
  );
}
