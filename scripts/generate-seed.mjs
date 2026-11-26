import { writeFile } from 'node:fs/promises'
import { categories } from '../src/data/categories.js'
import { products } from '../src/data/products.js'

function quote(value) {
  return value === null || value === undefined ? 'null' : `'${String(value).replaceAll("'", "''")}'`
}

const rows = [
  `insert into public.settings (id, shop_name, whatsapp_number, phone_number, address, map_lat, map_lng, opening_hours_text, facebook_url, instagram_url, delivery_areas) values (true, 'منظفات الإيمان', '2010XXXXXXXXX', '0100 000 0000', 'القاهرة، مصر (عنوان تجريبي)', null, null, 'يوميًا 9 ص - 10 م', 'https://facebook.com', 'https://instagram.com', '{}');`,
  ...categories.map((category, index) => `insert into public.categories (id, slug, name, image_path, sort_order) values (${quote(category.id)}, ${quote(category.slug)}, ${quote(category.name)}, ${quote(category.image)}, ${index});`),
  ...products.map((product) => `insert into public.products (id, category_id, name, brand, unit, description, image_path, price_egp, is_available, is_featured, created_at) values (${quote(product.id)}, ${quote(product.category)}, ${quote(product.name)}, ${quote(product.brand)}, ${quote(product.unit)}, ${quote(product.description)}, ${quote(product.image)}, ${product.price}, ${product.available}, ${product.bestSeller}, ${quote(`${product.createdAt}T00:00:00Z`)});`),
  `insert into auth.users (id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at) values ('00000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'owner@test.local', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()) on conflict (id) do nothing;`,
  `insert into private.shop_owner (user_id) values ('00000000-0000-4000-8000-000000000001') on conflict (singleton) do update set user_id = excluded.user_id;`,
]

await writeFile(new URL('../supabase/seed.sql', import.meta.url), `${rows.join('\n')}\n`)
