import { renderToString } from 'react-dom/server'
import { expect, it, vi } from 'vitest'
import { TestProviders } from '../test-utils'
import SearchPage from './SearchPage'

vi.mock('../routes/search', () => ({ Route: { useLoaderData: () => ({
  unavailable: false,
  categories: [{ id: 'cleaners', slug: 'cleaners', name: 'منظفات' }],
  products: [{ id: 'p1', name: 'سائل', brand: 'Pril', brandArabicName: 'بريل', category: 'cleaners', image: '', price: 30 }],
}) } }))
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  useSearch: () => ({ q: 'بريل' }),
  useNavigate: () => vi.fn(),
}))
vi.mock('../components/ProductGrid', () => ({ default: ({ products }: { products: { name: string }[] }) => <div>{products.map((product) => product.name).join(', ')}</div> }))

it('renders search results from the loader catalog on the server', () => {
  expect(renderToString(<TestProviders><SearchPage /></TestProviders>)).toContain('سائل')
})
