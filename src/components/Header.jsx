import shared from '../Storefront.module.css'
import { useState } from 'react';
import { Link, useLoaderData, useNavigate } from '@tanstack/react-router';
import { MagnifyingGlass, ShoppingCart, WhatsappLogo, X } from '@phosphor-icons/react';
import { ActionIcon, Anchor, Burger, Button, Combobox, Container, Group, Image, Text, TextInput, useCombobox } from '@mantine/core';
import { useCart } from '../context/useCart';
import { useSearchIndex } from '../search/useSearchIndex';
import { searchIndex } from '../search/search';
import { formatEGP } from '../utils/format';
import styles from './Header.module.css';

export default function Header() {
  const settings = useLoaderData({ from: '__root__' });
  const { categories } = settings;
  const { itemCount } = useCart();
  const [query, setQuery] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const index = useSearchIndex();
  const combobox = useCombobox({ onDropdownClose: () => combobox.resetSelectedOption() });
  const results = index && !index.unavailable ? searchIndex(index, query) : null;

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
      <Container className={[shared['container'], styles['header-bar']].join(' ')}>
        <Burger
          type="button"
          className={[styles['icon-btn'], styles['menu-toggle']].join(' ')}
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
          <Link to="/cart" className={[styles['icon-btn'], styles['cart-btn']].join(' ')} aria-label={`سلة التسوق، ${itemCount} قطعة`} onClick={closeAll}>
            <ShoppingCart />
            {itemCount > 0 && <span className={styles['cart-count']}>{itemCount}</span>}
          </Link>
        </Group>
      </Container>

      {isSearchOpen && (
        <div id="site-search" className={styles['search-panel']}>
          <form
            className={[shared['container'], styles['search-panel-form']].join(' ')}
            role="search"
            onSubmit={submitSearch}
            onKeyDown={(e) => e.key === 'Escape' && setIsSearchOpen(false)}
          >
            <MagnifyingGlass aria-hidden="true" />
            <Combobox store={combobox} width="target" position="bottom-start" offset={6} onOptionSubmit={(value) => {
              const [kind, id] = value.split(':');
              if (kind === 'product') navigate({ to: '/product/$id', params: { id } });
              else navigate({ to: '/category/$slug', params: { slug: id } });
              combobox.closeDropdown();
              setQuery('');
              closeAll();
            }}>
            <Combobox.Target withExpandedAttribute><TextInput
              className={styles['search-input']}
              type="search"
              value={query}
              onChange={(e) => { setQuery(e.target.value.slice(0, 60)); combobox.openDropdown(); combobox.resetSelectedOption(); }}
              onFocus={() => { if (query) combobox.openDropdown(); }}
              maxLength={60}
              placeholder="ابحث عن منتج أو ماركة..."
              aria-label="البحث في المتجر"
              autoFocus
            /></Combobox.Target>
            <Combobox.Dropdown><Combobox.Options mah={360} style={{ overflowY: 'auto' }}>
              {!index && <Combobox.Empty>جارٍ تحميل البحث...</Combobox.Empty>}
              {index?.unavailable && <Combobox.Empty>تعذر تحميل البحث، حاول تحديث الصفحة.</Combobox.Empty>}
              {results && results.products.length > 0 && <Combobox.Group label="المنتجات">
                {results.products.slice(0, 6).map((product) => <Combobox.Option key={product.id} value={`product:${product.id}`}>
                  <Group wrap="nowrap" gap="sm"><Image src={product.image || undefined} alt="" w={44} h={44} radius="sm" fit="cover" bg="gray.1" style={{ flexShrink: 0 }} /><div style={{ minWidth: 0 }}><Text size="sm" fw={600} lineClamp={1}>{product.name}</Text><Text size="sm" c="iman.7" className={shared['price']}>{formatEGP(product.price)}</Text></div></Group>
                </Combobox.Option>)}
              </Combobox.Group>}
              {results && results.categories.length > 0 && <Combobox.Group label="الأقسام">
                {results.categories.map((category) => <Combobox.Option key={category.id} value={`category:${category.slug}`}>{category.name}</Combobox.Option>)}
              </Combobox.Group>}
              {results && !results.products.length && !results.categories.length && <Combobox.Empty>
                {results.didYouMean ? <Link to="/search" search={{ q: results.didYouMean }} onClick={() => { combobox.closeDropdown(); closeAll(); }}>هل تقصد: {results.didYouMean}؟</Link> : 'لا توجد نتائج. جرّب كلمة أخرى.'}
              </Combobox.Empty>}
            </Combobox.Options></Combobox.Dropdown>
            </Combobox>
            <Button type="submit">بحث</Button>
          </form>
        </div>
      )}
    </header>
  );
}
