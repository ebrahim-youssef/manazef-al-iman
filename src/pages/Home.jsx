import { Link } from '@tanstack/react-router';
import { CaretLeft } from '@phosphor-icons/react';
import HeroBanner from '../components/HeroBanner';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';
import { Route } from '../routes/index';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import { getImageUrl } from '../utils/imageUrl';
import './Home.css';

const PRODUCTS_PER_SECTION = 4;

function SectionHeader({ title, subtitle, linkTo, linkLabel }) {
  return (
    <div className="section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {linkTo && (
        <Link to={linkTo} className="see-all">
          {linkLabel}
          <CaretLeft weight="bold" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

export default function Home() {
  const catalog = Route.useLoaderData();
  if (catalog.unavailable) return <CatalogUnavailable />;
  const { categories, products } = catalog;
  const saleOffers = products.filter((product) => product.isSaleActive).slice(0, PRODUCTS_PER_SECTION);
  const offerIds = new Set(saleOffers.map((p) => p.id));
  const bestSellers = products
    .filter((p) => p.bestSeller && !offerIds.has(p.id))
    .slice(0, PRODUCTS_PER_SECTION);

  return (
    <>
      <HeroBanner />

      <section className="section" id="categories">
        <div className="container">
          <SectionHeader title="تسوق حسب القسم" />
          <div className="home-categories-grid">
            {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} productCount={products.filter((product) => product.category === cat.id).length} />
            ))}
          </div>
        </div>
      </section>

      {saleOffers.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <SectionHeader
              title="عروض الجمعة"
              subtitle="خصومات لفترة محدودة على منتجات مختارة."
              linkTo="/category/offers"
              linkLabel="كل العروض"
            />
            <ProductGrid products={saleOffers} />
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <SectionHeader
            title="الأكثر مبيعًا"
            subtitle="ما يطلبه عملاؤنا كل أسبوع."
            linkTo="/category/cleaners"
            linkLabel="كل المنظفات"
          />
          <ProductGrid products={bestSellers} />
        </div>
      </section>

      <section className="wholesale-banner">
        <div className="container wholesale-banner-inner">
          <div>
            <h2>تسوق بالجملة</h2>
            <p>وفر أكتر مع عروض الكراتين والكميات. أسعار خاصة للكميات مع توضيح كامل لمحتوى كل كرتونة.</p>
          <Link to="/category/$slug" params={{ slug: 'wholesale' }} className="btn btn-primary">اكتشف منتجات الجملة</Link>
          </div>
          <div className="wholesale-banner-image">
            <img
              src={getImageUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80')}
              alt=""
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  );
}
