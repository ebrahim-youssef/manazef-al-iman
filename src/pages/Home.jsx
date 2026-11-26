import { Link } from '@tanstack/react-router';
import { CaretLeft, MapPinLine, ShoppingCartSimple, WhatsappLogo } from '@phosphor-icons/react';
import HeroBanner from '../components/HeroBanner';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';
import { Route } from '../routes/index';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import { getImageUrl } from '../utils/imageUrl';
import './Home.css';

const PRODUCTS_PER_SECTION = 4;
const ORDER_STEPS = [
  { label: 'اختر منتجاتك', Icon: ShoppingCartSimple },
  { label: 'اكتب عنوانك', Icon: MapPinLine },
  { label: 'أكد الطلب على واتساب', Icon: WhatsappLogo },
];

function OrderSteps() {
  return (
    <section className="home-order section" aria-labelledby="home-order-title">
      <div className="container">
        <h2 className="section-title" id="home-order-title">كيف تطلب؟</h2>
        <ol className="home-order-steps">
          {ORDER_STEPS.map(({ label, Icon }) => (
            <li key={label}>
              <span className="home-order-icon" aria-hidden="true"><Icon weight="duotone" /></span>
              {label}
            </li>
          ))}
        </ol>
        <p className="home-order-note">يتم الاتفاق على مصاريف التوصيل في المحادثة.</p>
      </div>
    </section>
  );
}

function SectionHeader({ title, subtitle, badge, linkTo, linkLabel, titleId }) {
  return (
    <div className="section-header">
      <div>
        <div className="section-title-row">
          <h2 className="section-title" id={titleId}>{title}</h2>
          {badge && <span className="badge badge-today">{badge}</span>}
        </div>
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
  const fridayDeals = products.filter((product) => product.fridayPrice !== null).slice(0, PRODUCTS_PER_SECTION);
  const isFridayActive = fridayDeals.some((product) => product.isFridayActive);
  const featuredProducts = products.filter((product) => product.bestSeller).slice(0, PRODUCTS_PER_SECTION);

  return (
    <>
      <HeroBanner />
      <OrderSteps />

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
        <section className="section section-alt" aria-labelledby="home-offers-title">
          <div className="container">
            <SectionHeader
              title="العروض"
              subtitle="خصومات لفترة محدودة على منتجات مختارة."
              linkTo="/category/offers"
              linkLabel="كل العروض"
              titleId="home-offers-title"
            />
            <ProductGrid products={saleOffers} />
          </div>
        </section>
      )}

      <section className="section home-friday" aria-labelledby="home-friday-title">
        <div className="container">
          <SectionHeader
            title="عروض الجمعة"
            subtitle="أسعار خاصة على منتجات مختارة كل يوم جمعة."
            badge={isFridayActive ? 'متاح اليوم' : null}
            titleId="home-friday-title"
          />
          <ProductGrid products={fridayDeals} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionHeader title="مختارات لك" />
          <ProductGrid products={featuredProducts} />
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
