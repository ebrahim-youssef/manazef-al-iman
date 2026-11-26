import { Link } from 'react-router-dom';
import HeroBanner from '../components/HeroBanner';
import CategoryCard from '../components/CategoryCard';
import ProductGrid from '../components/ProductGrid';
import { categories } from '../data/categories';
import { products } from '../data/products';
import { offerProducts } from '../data/offers';
import './Home.css';

export default function Home() {
  const bestSellers = products.filter((p) => p.bestSeller && p.unitType === 'retail').slice(0, 4);
  const fridayOffers = offerProducts.slice(0, 4);
  const featured = products.filter((p) => p.available).slice(0, 8);

  return (
    <>
      <HeroBanner />

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">تسوق حسب القسم</h2>
              <p className="section-subtitle">اختر القسم المناسب وابدأ التسوق بسهولة.</p>
            </div>
          </div>
          <div className="home-categories-grid">
            {categories.map((cat) => (
              <CategoryCard key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      <section className="section section-alt">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">الأكثر مبيعًا</h2>
              <p className="section-subtitle">منتجات يثق بها عملاؤنا ويطلبونها باستمرار.</p>
            </div>
            <Link to="/category/cleaners" className="btn btn-outline">عرض المزيد</Link>
          </div>
          <ProductGrid products={bestSellers} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">عروض الجمعة</h2>
              <p className="section-subtitle">خصومات مميزة لفترة محدودة على منتجات مختارة.</p>
            </div>
            <Link to="/category/offers" className="btn btn-outline">كل العروض</Link>
          </div>
          <ProductGrid products={fridayOffers} emptyMessage="لا توجد عروض حاليًا." />
        </div>
      </section>

      <section className="wholesale-banner">
        <div className="container wholesale-banner-inner">
          <div>
            <span className="hero-kicker">قسم الجملة</span>
            <h2>تسوق بالجملة</h2>
            <p>وفر أكتر مع عروض الكراتين والكميات. أسعار خاصة للكميات مع توضيح كامل لمحتوى كل كرتونة.</p>
            <Link to="/category/wholesale" className="btn btn-primary">اكتشف منتجات الجملة</Link>
          </div>
          <div className="wholesale-banner-image">
            <img
              src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
              alt="منتجات جملة وكراتين"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-header">
            <div>
              <h2 className="section-title">منتجات مميزة</h2>
              <p className="section-subtitle">تشكيلة مختارة من أفضل المنتجات المتوفرة لدينا.</p>
            </div>
          </div>
          <ProductGrid products={featured} />
        </div>
      </section>
    </>
  );
}
