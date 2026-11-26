import { useMemo, useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { categories } from '../data/categories';
import { products } from '../data/products';
import './CategoryPage.css';

const sortOptions = [
  { value: 'default', label: 'الترتيب الافتراضي' },
  { value: 'price-asc', label: 'الأقل سعرًا' },
  { value: 'price-desc', label: 'الأعلى سعرًا' },
  { value: 'best', label: 'الأكثر مبيعًا' },
  { value: 'newest', label: 'الأحدث' },
];

export default function CategoryPage() {
  const { slug } = useParams();
  const category = categories.find((c) => c.slug === slug);

  const baseProducts = useMemo(() => {
    if (slug === 'offers') return products.filter((p) => p.originalPrice && p.originalPrice > p.price);
    if (!category) return [];
    return products.filter((p) => p.category === category.id);
  }, [slug, category]);

  const brands = useMemo(() => [...new Set(baseProducts.map((p) => p.brand))].sort(), [baseProducts]);

  const [search, setSearch] = useState('');
  const [brand, setBrand] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sort, setSort] = useState('default');

  useEffect(() => {
    setSearch('');
    setBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setSort('default');
  }, [slug]);

  const filtered = useMemo(() => {
    let list = [...baseProducts];
    const q = search.trim().toLowerCase();
    if (q) list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    if (brand !== 'all') list = list.filter((p) => p.brand === brand);
    const min = minPrice === '' ? null : Number(minPrice);
    const max = maxPrice === '' ? null : Number(maxPrice);
    if (min !== null && !Number.isNaN(min)) list = list.filter((p) => p.price >= min);
    if (max !== null && !Number.isNaN(max)) list = list.filter((p) => p.price <= max);

    switch (sort) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'best':
        list.sort((a, b) => Number(b.bestSeller) - Number(a.bestSeller));
        break;
      case 'newest':
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
      default:
        break;
    }
    return list;
  }, [baseProducts, search, brand, minPrice, maxPrice, sort]);

  if (!category) {
    return (
      <div className="container section">
        <div className="empty-state">
          <div className="empty-icon">🔎</div>
          <h3>القسم غير موجود</h3>
          <p>لم نتمكن من العثور على هذا القسم.</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16 }}>العودة للرئيسية</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">الرئيسية</Link>
            <span>/</span>
            <span>{category.name}</span>
          </div>
          <h1>{category.name}</h1>
          <p>{category.description}</p>
        </div>
      </div>

      <section className="section">
        <div className="container category-layout">
          <aside className="filters-panel">
            <div className="filters-head">
              <h2>تصفية المنتجات</h2>
              <button
                type="button"
                className="filters-clear"
                onClick={() => { setSearch(''); setBrand('all'); setMinPrice(''); setMaxPrice(''); setSort('default'); }}
              >
                مسح
              </button>
            </div>

            <label className="filter-field">
              <span>بحث داخل القسم</span>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="اسم المنتج أو الشركة..."
              />
            </label>

            <label className="filter-field">
              <span>الشركة / الماركة</span>
              <select value={brand} onChange={(e) => setBrand(e.target.value)}>
                <option value="all">كل الماركات</option>
                {brands.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </label>

            <div className="filter-field">
              <span>السعر (جنيه)</span>
              <div className="price-inputs">
                <input
                  type="number"
                  min="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="من"
                />
                <input
                  type="number"
                  min="0"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="إلى"
                />
              </div>
            </div>

            <label className="filter-field">
              <span>الترتيب</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                {sortOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </label>
          </aside>

          <div className="category-results">
            <div className="results-bar">
              <p>عدد المنتجات المعروضة: <strong>{filtered.length}</strong></p>
            </div>
            <ProductGrid
              products={filtered}
              emptyMessage="جرّب تغيير البحث أو الفلاتر لعرض منتجات أخرى."
            />
          </div>
        </div>
      </section>
    </>
  );
}
