import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { MagnifyingGlass } from '@phosphor-icons/react';
import ProductGrid from '../components/ProductGrid';
import { Route } from '../routes/search';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import './SearchPage.css';

export default function SearchPage() {
  const catalog = Route.useLoaderData();
  const { q: searchQuery } = useSearch({ from: '/search' });
  const navigate = useNavigate({ from: '/search' });
  const q = searchQuery.trim();
  if (catalog.unavailable) return <CatalogUnavailable />;
  const results = catalog.products;

  return (
    <section className="page">
      <div className="container">
        <nav className="breadcrumb" aria-label="مسار التنقل">
          <Link to="/">الرئيسية</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">البحث</span>
        </nav>
        <header className="page-head">
          <h1>{q ? `نتائج «${q}»` : 'البحث'}</h1>
        </header>

        {/* Keyed on the URL query so the box shows the new term after a header search. */}
        <SearchBox key={q} initialQuery={q} onSearch={(term) => navigate({ search: { q: term } })} />

        {q && (
          <div className="results-bar">
            <p aria-live="polite">{results.length} منتج</p>
          </div>
        )}
        {q ? (
          <ProductGrid products={results} emptyMessage="جرّب اسم ماركة أو كلمة أقصر." />
        ) : (
          <p className="search-hint">اكتب اسم المنتج أو الماركة، مثل «بريل» أو «أريال».</p>
        )}
      </div>
    </section>
  );
}

function SearchBox({ initialQuery, onSearch }) {
  const [term, setTerm] = useState(initialQuery);
  return (
    <form
      className="listing-toolbar"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        onSearch(term.trim());
      }}
    >
      <label className="listing-search">
        <MagnifyingGlass aria-hidden="true" />
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="ابحث عن منتج أو ماركة..."
          aria-label="البحث في المتجر"
          autoFocus={!initialQuery}
        />
      </label>
      <button type="submit" className="btn btn-primary search-submit">بحث</button>
    </form>
  );
}
