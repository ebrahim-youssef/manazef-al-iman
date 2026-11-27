import { Box } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { CaretLeft, MapPinLine, ShoppingCartSimple, WhatsappLogo } from '@phosphor-icons/react';
import HeroBanner from '../components/HeroBanner';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';
import { Route } from '../routes/index';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import { getImageUrl } from '../utils/imageUrl';
import styles from './Home.module.css';

const PRODUCTS_PER_SECTION = 4;
const ORDER_STEPS = [
  { label: 'اختر منتجاتك', Icon: ShoppingCartSimple },
  { label: 'اكتب عنوانك', Icon: MapPinLine },
  { label: 'أكد الطلب على واتساب', Icon: WhatsappLogo },
];

function OrderSteps() {
  return (
    <section className={styles['home-order'] + ' ' + 'section'} aria-labelledby="home-order-title">
      <Box className="container">
        <h2 className="section-title" id="home-order-title">كيف تطلب؟</h2>
        <ol className={styles['home-order-steps']}>
          {ORDER_STEPS.map(({ label, Icon }) => (
            <li key={label}>
              <span className={styles['home-order-icon']} aria-hidden="true"><Icon weight="duotone" /></span>
              {label}
            </li>
          ))}
        </ol>
        <p className={styles['home-order-note']}>يتم الاتفاق على مصاريف التوصيل في المحادثة.</p>
      </Box>
    </section>
  );
}

function SectionHeader({ title, subtitle, badge, linkTo, linkLabel, titleId }) {
  return (
    <Box className="section-header">
      <Box>
        <Box className={styles['section-title-row']}>
          <h2 className="section-title" id={titleId}>{title}</h2>
          {badge && <span className={'badge' + ' ' + styles['badge-today']}>{badge}</span>}
        </Box>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </Box>
      {linkTo && (
        <Link to={linkTo} className="see-all">
          {linkLabel}
          <CaretLeft weight="bold" aria-hidden="true" />
        </Link>
      )}
    </Box>
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
        <Box className="container">
          <SectionHeader title="تسوق حسب القسم" />
          <Box className={styles['home-categories-grid']}>
            {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} productCount={products.filter((product) => product.category === cat.id).length} />
            ))}
          </Box>
        </Box>
      </section>

      {saleOffers.length > 0 && (
        <section className={'section' + ' ' + styles['section-alt']} aria-labelledby="home-offers-title">
          <Box className="container">
            <SectionHeader
              title="العروض"
              subtitle="خصومات لفترة محدودة على منتجات مختارة."
              linkTo="/category/offers"
              linkLabel="كل العروض"
              titleId="home-offers-title"
            />
            <ProductGrid products={saleOffers} />
          </Box>
        </section>
      )}

      <section className={'section' + ' ' + styles['home-friday']} aria-labelledby="home-friday-title">
        <Box className="container">
          <SectionHeader
            title="عروض الجمعة"
            subtitle="أسعار خاصة على منتجات مختارة كل يوم جمعة."
            badge={isFridayActive ? 'متاح اليوم' : null}
            titleId="home-friday-title"
          />
          <ProductGrid products={fridayDeals} />
        </Box>
      </section>

      <section className="section">
        <Box className="container">
          <SectionHeader title="مختارات لك" />
          <ProductGrid products={featuredProducts} />
        </Box>
      </section>

      <section className={styles['wholesale-banner']}>
        <Box className={'container' + ' ' + styles['wholesale-banner-inner']}>
          <Box>
            <h2>تسوق بالجملة</h2>
            <p>وفر أكتر مع عروض الكراتين والكميات. أسعار خاصة للكميات مع توضيح كامل لمحتوى كل كرتونة.</p>
          <Link to="/category/$slug" params={{ slug: 'wholesale' }} className="btn btn-primary">اكتشف منتجات الجملة</Link>
          </Box>
          <Box className={styles['wholesale-banner-image']}>
            <img
              src={getImageUrl('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80')}
              alt=""
              loading="lazy"
            />
          </Box>
        </Box>
      </section>
    </>
  );
}
