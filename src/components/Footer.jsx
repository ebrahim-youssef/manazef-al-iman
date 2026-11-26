import { Link } from '@tanstack/react-router';
import { FacebookLogo, InstagramLogo, TiktokLogo, WhatsappLogo } from '@phosphor-icons/react';
import { shopDefaults } from '../config/shopDefaults';
import { categories } from '../data/categories';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col footer-brand-col">
          <Link to="/" className="footer-brand">منظفات الإيمان</Link>
          <p>
            متجرك الموثوق للمنظفات ومستحضرات التجميل ومنتجات الجملة. نوفر لك جودة عالية وأسعار مناسبة لكل احتياجات بيتك.
          </p>
          <div className="footer-social">
            <a href={shopDefaults.facebook_url} target="_blank" rel="noreferrer" ><FacebookLogo aria-hidden="true" />فيسبوك</a>
            <a href={shopDefaults.instagram_url} target="_blank" rel="noreferrer" ><InstagramLogo aria-hidden="true" />إنستجرام</a>
            <a href={shopDefaults.tiktok_url} target="_blank" rel="noreferrer" ><TiktokLogo aria-hidden="true" />تيك توك</a>
            <a href={`https://wa.me/${shopDefaults.whatsapp_number}`} target="_blank" rel="noreferrer" ><WhatsappLogo aria-hidden="true" />واتساب</a>
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
            <li><span>الهاتف:</span> <a href={`tel:+${shopDefaults.whatsapp_number}`}>{shopDefaults.phone_number}</a></li>
            <li><span>واتساب:</span> <a href={`https://wa.me/${shopDefaults.whatsapp_number}`} target="_blank" rel="noreferrer">{shopDefaults.phone_number}</a></li>
            <li><span>العنوان:</span> القاهرة، مصر (عنوان تجريبي)</li>
            <li><span>ساعات العمل:</span> يوميًا 9 ص - 10 م</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container footer-bottom-inner">
          <p>© {new Date().getFullYear()} منظفات الإيمان. جميع الحقوق محفوظة.</p>
          <p>الأسعار بالجنيه المصري (EGP)</p>
        </div>
      </div>
    </footer>
  );
}
