import { useState } from 'react';
import { Link, useLoaderData, useNavigate } from '@tanstack/react-router';
import { MagnifyingGlass, ShoppingCart, WhatsappLogo, X } from '@phosphor-icons/react';
import { ActionIcon, Anchor, Burger, Container, Group, TextInput } from '@mantine/core';
import { useCart } from '../context/useCart';
import styles from './Header.module.css';

export default function Header() {
  const settings = useLoaderData({ from: '__root__' });
  const { categories } = settings;
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();

  const closeAll = () => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  };

  const toggleSearch = () => {
    setIsMenuOpen(false);
    setIsSearchOpen((open) => !open);
  };

  const toggleMenu = () => {
    setIsSearchOpen(false);
    setIsMenuOpen((open) => !open);
  };

  const submitSearch = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    navigate({ to: '/search', search: { q } });
    setQuery('');
    closeAll();
  };

  return (
    <header className={styles['site-header']}>
      <Container className={'container' + ' ' + styles['header-bar']}>
        <Burger
          type="button"
          className={styles['icon-btn'] + ' ' + styles['menu-toggle']}
          aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          aria-expanded={isMenuOpen}
          aria-controls="site-nav"
          opened={isMenuOpen}
          onClick={toggleMenu}
        />

        <Link to="/" className={styles['brand']} onClick={closeAll}>
          {settings.shop_name}
        </Link>

        <nav id="site-nav" className={`${styles["site-nav"]} ${isMenuOpen ? styles.open : ""}`} aria-label="الأقسام">
          <ul className={styles['nav-list']}>
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  to="/category/$slug"
                  params={{ slug: category.slug }}
                  activeOptions={{ exact: false }}
                  activeProps={{ className: styles.active }}
                  className={styles['nav-link']}
                  onClick={closeAll}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
          <Anchor href={`https://wa.me/${settings.whatsapp_number}`} target="_blank" rel="noreferrer" className={styles['nav-whatsapp']}>
            <WhatsappLogo aria-hidden="true" />
            تواصل معنا عبر واتساب
          </Anchor>
        </nav>

        <Group className={styles['header-actions']}>
          <ActionIcon
            type="button"
            className={styles['icon-btn']}
            aria-label={isSearchOpen ? 'إغلاق البحث' : 'بحث'}
            aria-expanded={isSearchOpen}
            aria-controls="site-search"
            onClick={toggleSearch}
          >
            {isSearchOpen ? <X weight="bold" /> : <MagnifyingGlass />}
          </ActionIcon>
          <Link to="/cart" className={styles['icon-btn'] + ' ' + styles['cart-btn']} aria-label={`سلة التسوق، ${itemCount} قطعة`} onClick={closeAll}>
            <ShoppingCart />
            {itemCount > 0 && <span className={styles['cart-count']}>{itemCount}</span>}
          </Link>
        </Group>
      </Container>

      {isSearchOpen && (
        <div id="site-search" className={styles['search-panel']}>
          <form
            className={'container' + ' ' + styles['search-panel-form']}
            role="search"
            onSubmit={submitSearch}
            onKeyDown={(e) => e.key === 'Escape' && setIsSearchOpen(false)}
          >
            <MagnifyingGlass aria-hidden="true" />
            <TextInput
              className={styles['search-input']}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث عن منتج أو ماركة..."
              aria-label="البحث في المتجر"
              autoFocus
            />
            <button type="submit" className={'btn' + ' ' + 'btn-primary'}>بحث</button>
          </form>
        </div>
      )}
    </header>
  );
}
