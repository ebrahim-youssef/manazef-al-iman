import shared from '../Storefront.module.css'
import { useState } from 'react';
import { Link, useNavigate, useSearch } from '@tanstack/react-router';
import { Anchor, Box, Button, Container, Group, Text, TextInput, Title } from '@mantine/core';
import ProductGrid from '../components/ProductGrid';
import { Route } from '../routes/search';
import { CatalogUnavailable } from '../components/CatalogUnavailable';
import { searchIndex } from '../search/search';
import { useSearchIndex } from '../search/useSearchIndex';

export default function SearchPage() {
  const catalog = Route.useLoaderData();
  const { q: searchQuery } = useSearch({ from: '/search' });
  const navigate = useNavigate({ from: '/search' });
  const index = useSearchIndex();
  const q = searchQuery.slice(0, 60).trim();
  if (catalog.unavailable || index?.unavailable) return <CatalogUnavailable />;
  const matches = index ? searchIndex(index, q) : null;
  const productsById = new Map(catalog.products.map((product) => [product.id, product]));
  const products = matches ? matches.products.map((product) => productsById.get(product.id)).filter(Boolean) : [];

  return (
    <Box component="section" className={shared['page']}>
      <Container className={shared['container']}>
        <nav className={shared['breadcrumb']} aria-label="مسار التنقل"><Link to="/">الرئيسية</Link><span aria-hidden="true">/</span><span aria-current="page">البحث</span></nav>
        <Box component="header" className={shared['page-head']}><Title order={1}>{q ? `نتائج «${q}»` : 'البحث'}</Title></Box>
        <SearchBox key={q} initialQuery={q} onSearch={(term) => navigate({ search: { q: term } })} />
        {q && !matches && <Text role="status">جارٍ تحميل البحث...</Text>}
        {q && matches && <>
          <Text aria-live="polite" my="md">{products.length} منتج</Text>
          {matches.categories.map((category) => <Anchor key={category.id} component={Link} to="/category/$slug" params={{ slug: category.slug }} display="block">{category.name}</Anchor>)}
          {matches.didYouMean && <Anchor component={Link} to="/search" search={{ q: matches.didYouMean }}>هل تقصد: {matches.didYouMean}؟</Anchor>}
          <ProductGrid products={products} emptyMessage="جرّب اسم ماركة أو كلمة أقصر." />
        </>}
        {!q && <Text c="dimmed" py="xl">اكتب اسم المنتج أو الماركة، مثل «بريل» أو «أريال».</Text>}
      </Container>
    </Box>
  );
}

function SearchBox({ initialQuery, onSearch }) {
  const [term, setTerm] = useState(initialQuery);
  return <Group component="form" role="search" onSubmit={(event) => { event.preventDefault(); onSearch(term.trim()); }} mb="md">
    <TextInput type="search" value={term} onChange={(event) => setTerm(event.target.value)} maxLength={60} placeholder="ابحث عن منتج أو ماركة..." aria-label="البحث في المتجر" autoFocus={!initialQuery} style={{ flex: 1 }} />
    <Button type="submit">بحث</Button>
  </Group>;
}
