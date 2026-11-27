import { Box } from '@mantine/core';
import { Link } from '@tanstack/react-router';
import { Package, Truck, WhatsappLogo } from '@phosphor-icons/react';
import { getImageUrl } from '../utils/imageUrl';
import styles from './HeroBanner.module.css';

export default function HeroBanner() {
  return (
    <section className={styles['hero']}>
      <Box className={'container' + ' ' + styles['hero-inner']}>
        <Box className={styles['hero-content']}>
          <h1>كل احتياجات بيتك في مكان واحد</h1>
          <p>اكتشف مجموعة متنوعة من المنظفات ومستحضرات التجميل بأسعار مميزة.</p>
          <Box className={styles['hero-actions']}>
            <Link to="/category/cleaners" className="btn btn-primary">تسوق الآن</Link>
            <Link to="/category/offers" className="btn btn-outline">شاهد العروض</Link>
          </Box>
          <ul className={styles['hero-facts']}>
            <li><Package aria-hidden="true" />جملة وقطاعي</li>
            <li><Truck aria-hidden="true" />توصيل داخل محافظتك</li>
            <li><WhatsappLogo aria-hidden="true" />الطلب عبر واتساب</li>
          </ul>
        </Box>
        <Box className={styles['hero-visual']}>
          <img
            src={getImageUrl('https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1200&q=80')}
            alt="منتجات تنظيف ومنظفات منزلية"
          />
        </Box>
      </Box>
    </section>
  );
}
