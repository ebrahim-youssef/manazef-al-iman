import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import './Header.css';

const navItems = [
  { to: '/', label: 'الرئيسية', end: true },
  { to: '/category/cosmetics', label: 'مستحضرات تجميل' },
  { to: '/category/cleaners', label: 'منظفات' },
  { to: '/category/industrial', label: 'منظفات صناعية' },
  { to: '/category/groceries', label: 'جردوات' },
  { to: '/category/wholesale', label: 'الجملة' },
  { to: '/category/offers', label: 'عروض الجمعة' },
];

export default function Header() {
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setMenuOpen(false);
  };

  return (
    <header className="site-header">
      <div className="header-top">
        <div className="container header-top-inner">
          <button
            type="button"
            className="menu-toggle"
            aria-label="فتح القائمة"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>

          <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
            <span className="brand-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5-4.9-2.6-4.9 2.6.9-5.5-4-3.9 5.5-.8L12 3z"/></svg>
            </span>
            <span className="brand-text">
              <strong>منظفات الإيمان</strong>
              <small>نظافة وثقة لكل بيت</small>
            </span>
          </Link>

          <form className="header-search" onSubmit={submitSearch} role="search">
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منتج أو شركة أو قسم..."
              aria-label="البحث عن منتج"
            />
            <button type="submit" aria-label="بحث">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
            </button>
          </form>

          <div className="header-actions">
            <a
              href="https://wa.me/2010XXXXXXXXX"
              target="_blank"
              rel="noreferrer"
              className="icon-btn"
              aria-label="تواصل واتساب"
              title="تواصل عبر واتساب"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M20 11.5a8 8 0 0 1-11.9 7L4 20l1.6-3.9A8 8 0 1 1 20 11.5z"/><path d="M8.5 9.5c.5 2 2.5 4 4.5 4.5l1.5-1 2 1-.5 2c-2 1-5-.5-7-2.5s-3.5-5-2.5-7l2-.5 1 2-1 1.5z"/></svg>
            </a>
            <Link to="/cart" className="icon-btn cart-btn" aria-label="سلة التسوق" onClick={() => setMenuOpen(false)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="20" r="1.5"/><circle cx="17" cy="20" r="1.5"/><path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.9a2 2 0 0 0 2-1.6L20 7H6"/></svg>
              {itemCount > 0 && <span className="cart-count">{itemCount}</span>}
            </Link>
          </div>
        </div>
      </div>

      <nav className={`header-nav ${menuOpen ? 'open' : ''}`} aria-label="التنقل الرئيسي">
        <div className="container">
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </header>
  );
}
