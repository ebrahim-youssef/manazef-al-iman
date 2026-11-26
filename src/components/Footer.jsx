import { Link } from 'react-router-dom';
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
            <a href="https://facebook.com" target="_blank" rel="noreferrer" aria-label="فيسبوك">فيسبوك</a>
            <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="إنستجرام">إنستجرام</a>
            <a href="https://wa.me/2010XXXXXXXXX" target="_blank" rel="noreferrer" aria-label="واتساب">واتساب</a>
          </div>
        </div>

        <div className="footer-col">
          <h4>روابط سريعة</h4>
          <ul>
            <li><Link to="/">الرئيسية</Link></li>
            <li><Link to="/category/cleaners">منظفات</Link></li>
            <li><Link to="/category/cosmetics">مستحضرات تجميل</Link></li>
            <li><Link to="/category/wholesale">قسم الجملة</Link></li>
            <li><Link to="/category/offers">عروض الجمعة</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>الأقسام</h4>
          <ul>
            <li><Link to="/category/industrial">منظفات صناعية</Link></li>
            <li><Link to="/category/groceries">جردوات</Link></li>
            <li><Link to="/cart">سلة التسوق</Link></li>
            <li><Link to="/search?q=بريل">بحث سريع</Link></li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>تواصل معنا</h4>
          <ul className="footer-contact">
            <li><span>الهاتف:</span> <a href="tel:+201000000000">0100 000 0000</a></li>
            <li><span>واتساب:</span> <a href="https://wa.me/2010XXXXXXXXX" target="_blank" rel="noreferrer">010X XXX XXXX</a></li>
            <li><span>العنوان:</span> القاهرة، مصر (عنوان تجريبي)</li>
            <li><span>ساعات العمل:</span> يوميًا 9 ص - 11 م</li>
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
