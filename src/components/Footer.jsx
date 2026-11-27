import { Link, useLoaderData } from '@tanstack/react-router';
import { FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo } from '@phosphor-icons/react';
import { formatEgyptianMobile } from '../config/shopDefaults';
import './Footer.css';

export default function Footer() {
  const settings = useLoaderData({ from: '__root__' });
  const { categories } = settings;
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col footer-brand-col">
          <Link to="/" className="footer-brand">{settings.shop_name}</Link>
          <p>
            متجرك الموثوق للمنظفات ومستحضرات التجميل ومنتجات الجملة. نوفر لك جودة عالية وأسعار مناسبة لكل احتياجات بيتك.
          </p>
          <div className="footer-social">
            <a href={settings.facebook_url} target="_blank" rel="noreferrer" ><FacebookLogo aria-hidden="true" />فيسبوك</a>
            <a href={settings.instagram_url} target="_blank" rel="noreferrer" ><InstagramLogo aria-hidden="true" />إنستجرام</a>
            <a href={settings.tiktok_url} target="_blank" rel="noreferrer" ><TiktokLogo aria-hidden="true" />تيك توك</a>
            <a href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" ><WhatsappLogo aria-hidden="true" />واتساب</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>الأقسام</h4>
          <ul>
            {categories.map((category) => (
              <li key={category.id}><Link to={`/category/${category.slug}`}>{category.name}</Link></li>
            ))}
          </ul>
        </div>

        <div className="footer-col">
          <h4>تواصل معنا</h4>
          <ul className="footer-contact">
            <li><span>الهاتف:</span> <a dir="ltr" href={`tel:${settings.phone_number.replace(/[\s()-]/g, '')}`}>{settings.phone_number}</a></li>
            <li><span>واتساب:</span> <a dir="ltr" href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer">{formatEgyptianMobile(settings.whatsapp_number)}</a></li>
            <li><span>العنوان:</span> {settings.address}</li>
            <li><span>ساعات العمل:</span> {settings.opening_hours_text}</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} {settings.shop_name}. جميع الحقوق محفوظة.</p>
          <p>الأسعار بالجنيه المصري (EGP)</p>
        </div>
      </div>
    </footer>
  );
}
