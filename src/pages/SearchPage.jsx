import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductGrid from '../components/ProductGrid';
import { products } from '../data/products';
import { categories } from '../data/categories';
import './SearchPage.css';

export default function SearchPage() {
  const [params] = useSearchParams();
  const q = (params.get('q') || '').trim();

  const results = useMemo(() => {
    if (!q) return [];
    const term = q.toLowerCase();
    return products.filter((p) => {
      const cat = categories.find((c) => c.id === p.category);
      return (
        p.name.toLowerCase().includes(term) ||
        p.brand.toLowerCase().includes(term) ||
        (cat && cat.name.toLowerCase().includes(term))
      );
    });
  }, [q]);

  return (
    <>
      <div className="page-hero">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">الرئيسية</Link>
            <span>/</span>
            <span>نتائج البحث</span>
          </div>
          <h1>نتائج البحث</h1>
          <p>{q ? `نتائج البحث عن: "${q}"` : 'اكتب كلمة للبحث عن منتج أو شركة أو قسم.'}</p>
        </div>
      </div>

      <section className="section">
        <div className="container">
          <div className="results-bar">
            <p>عدد النتائج: <strong>{results.length}</strong></p>
          </div>
          <ProductGrid
            products={results}
            emptyMessage={q ? 'لم نعثر على منتجات مطابقة لبحثك. جرّب كلمة أخرى.' : 'استخدم شريط البحث في الأعلى للبحث عن المنتجات.'}
          />
        </div>
      </section>
    </>
  );
}
