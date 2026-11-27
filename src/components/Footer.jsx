import shared from '../Storefront.module.css'
import { Link, useLoaderData } from '@tanstack/react-router';
import { FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo } from '@phosphor-icons/react';
import { Anchor, Container, Group } from '@mantine/core';
import { formatEgyptianMobile } from '../config/shopDefaults';
import styles from './Footer.module.css';

export default function Footer() {
  const settings = useLoaderData({ from: '__root__' });
  const { categories } = settings;
  return (
    <footer className={styles['site-footer']}>
      <Container className={[shared['container'], styles['footer-grid']].join(' ')}>
        <div className={[styles['footer-col'], styles['footer-brand-col']].join(' ')}>
          <Link to="/" className={styles['footer-brand']}>{settings.shop_name}</Link>
          <p>
            متجرك الموثوق للمنظفات ومستحضرات التجميل ومنتجات الجملة. نوفر لك جودة عالية وأسعار مناسبة لكل احتياجات بيتك.
          </p>
          <Group className={styles['footer-social']}>
            <a href={settings.facebook_url} target="_blank" rel="noreferrer" ><FacebookLogo aria-hidden="true" />فيسبوك</a>
            <a href={settings.instagram_url} target="_blank" rel="noreferrer" ><InstagramLogo aria-hidden="true" />إنستجرام</a>
            <a href={settings.tiktok_url} target="_blank" rel="noreferrer" ><TiktokLogo aria-hidden="true" />تيك توك</a>
            <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" ><WhatsappLogo aria-hidden="true" />واتساب</a>
          </Group>
        </div>

        <div className={styles['footer-col']}>
          <h4>الأقسام</h4>
          <ul>
            {categories.map((category) => (
              <li key={category.id}><Link to={`/category/${category.slug}`}>{category.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className={styles['footer-col']}>
          <h4>تواصل معنا</h4>
          <ul className={styles['footer-contact']}>
            <li><span>الهاتف:</span> <Anchor dir="ltr" href={`tel:${settings.phone_number.replace(/[\s()-]/g, '')}`}>{settings.phone_number}</Anchor></li>
            <li><span>واتساب:</span> <a dir="ltr" href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer">{formatEgyptianMobile(settings.whatsapp_number)}</a></li>
            <li><span>العنوان:</span> {settings.address}</li>
            <li><span>ساعات العمل:</span> {settings.opening_hours_text}</li>
          </ul>
        </div>
      </Container>
      <div className={styles['footer-bottom']}>
        <Container className={[shared['container'], styles['footer-bottom-inner']].join(' ')}>
          <p>© {new Date().getFullYear()} {settings.shop_name}. جميع الحقوق محفوظة.</p>
          <p>الأسعار بالجنيه المصري (EGP)</p>
        </Container>
      </div>
    </footer>
  );
}
