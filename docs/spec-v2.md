# منظفات الإيمان v2 spec

Status: draft, waiting for owner approval. Written 2026-11-27 from grilling rounds 1 to 5.

## 1. Goal

Turn the current static prototype into a working shop with a real catalog, cart, WhatsApp checkout, and a phone-first admin page for the owner. This version ships complete, admin included. Everything runs on free plans with no billing card.

Out of scope for this version (planned later): size/variant pricing, stock quantities, per-area delivery fees, automatic best sellers, PWA install, custom domain, customer accounts, online payment.

## 2. Stack

| Part | Choice | Why |
|---|---|---|
| Framework | TanStack Start 1.x (React 19) | Front end and server functions in one project; first-party Cloudflare guide. Not Next.js (awkward off Vercel; T3 is Next.js underneath). |
| Hosting | Cloudflare Workers free, `*.workers.dev` | No card. 100k requests/day, static assets free. |
| Database, login, images | Supabase free (Postgres, Auth, Storage) | No card. 1 GB storage, 5 GB cached + 5 GB uncached egress per month. |
| Bot check | Cloudflare Turnstile (invisible) | Free, stops scripted fake orders. |
| Keepalive | GitHub Actions daily cron running one real DB query | Supabase free pauses after 7 days with no DB activity. Not guaranteed by Supabase; it is insurance. |
| Styling | Keep current plain CSS, tokens, Phosphor icons, Thmanyah locally with Cairo fallback | Owner is happy with the current look. |

The current Vite components and CSS move into TanStack routes with the same look. Data moves from `src/data/*.js` into Supabase.

All image URLs go through one helper (`getImageUrl(path, size)`), so moving storage to another provider later touches one file.

## 3. Data model

All money is whole Egyptian pounds (integer). All dates are stored in UTC and shown and calculated in `Africa/Cairo`.

**settings** (single row)
- shop_name, whatsapp_number, phone_number, address, map_lat, map_lng, opening_hours_text, facebook_url, instagram_url, delivery_areas (text array).
- Defaults live in `src/config/shopDefaults.ts`. The admin settings page overrides them. Until the owner fills them in, the current fake values stay as placeholders.

**categories**
- id, slug, name, image_path, sort_order.
- Seeded with the current six: cosmetics, cleaners, industrial, groceries, wholesale, offers. "offers" is a view of products with an active discount, not a hand-filled category.

**products**
- id, category_id, name, brand, unit, description, image_path, price_egp (required).
- is_available (on/off), is_featured (shows in "مختارات لك").
- Dated sale: sale_type (`none` / `price` / `percent`), sale_value, sale_starts_at, sale_ends_at.
- Friday deal: friday_type (`none` / `price` / `percent`), friday_value.
- created_at, updated_at.

**orders**
- id, code (short random, unique), status (`new` / `fulfilled` / `cancelled`), total_egp, item_count, created_at, status_changed_at.
- No customer data at all: no name, phone, area, or address.

**order_items**
- order_id, product_id (set to null if the product is later deleted), product_name, unit, unit_price_egp, quantity, line_total_egp.
- Name and price are copied at order time so old orders and earnings never change.

## 4. Pricing rules

1. Every product has an original price.
2. The dated sale is active when `sale_starts_at <= now < sale_ends_at` (Cairo time). Either date may be empty, meaning "already started" or "never ends".
3. The Friday deal is active when today is Friday in Cairo time.
4. Each active discount gives a candidate price: `price` type uses the value directly; `percent` type is `price_egp * (100 - value) / 100`.
5. The shown price is the lowest of the original price and the active candidates, rounded to the nearest whole pound.
6. A sale price at or above the original price, or a percent outside 1 to 90, is rejected in the admin form.
7. The badge shows the effective percent off, worked out from the original and shown prices.
8. This runs in one shared function used by the server (order creation) and the pages (display). The server result is the only one saved.

## 5. Customer flows

**Home page**, top to bottom:
1. Hero (unchanged).
2. "How to order" strip: اختر منتجاتك ← اكتب عنوانك ← أكد الطلب على واتساب. Says the delivery fee is agreed in the chat.
3. Categories.
4. العروض: products with an active dated sale. Hidden when there are none.
5. عروض الجمعة: always shown. On Friday the label is "متاح اليوم" with the deal prices. On other days each card shows the normal price plus "الجمعة بـ X ج".
6. مختارات لك: products with `is_featured`.
7. Wholesale banner (wholesale is a normal category of big packs, same checkout).
8. زورنا: Google Maps embed at the settings location (placeholder for now), address, hours (يوميًا 9 ص - 10 م), "افتح في الخرائط" and WhatsApp buttons.
9. Footer.

**Product cards and product page**: only "أضف للسلة" and a cart button. No direct WhatsApp button. Out-of-stock products stay visible with "غير متوفر" and a disabled button.

**Cart**
- Saved on the device (localStorage), so a customer who leaves can continue later.
- Always shows current prices from the server. Items that became unavailable or were deleted are marked and left out of the order.
- Subtotal shown without delivery.

**Checkout** (form under the cart)
- Fields: name, phone (Egyptian mobile format), area (dropdown from settings), address, optional notes.
- Form values stay on the device only. They never reach the database.
- On "أكد الطلب على واتساب":
  1. Turnstile token and cart (product ids and quantities only) go to the `createOrder` server function.
  2. The server checks the token, loads products, drops unavailable ones, recalculates prices, saves the order and its items, and returns the code and the real lines.
  3. The browser builds the WhatsApp message from the server's lines and the local form values, then navigates to `https://wa.me/<number>?text=...`. Same tab navigation, so popup blockers do not stop it.
  4. The cart is cleared once the order code comes back.

**WhatsApp message template**
```
طلب جديد #K7Q2X9
الاسم: ...
الموبايل: ...
المنطقة: ...
العنوان: ...
ملاحظات: ...

- منتج أ × 2 = 160 ج
- منتج ب × 1 = 45 ج
الإجمالي بدون التوصيل: 205 ج
```

## 6. Admin (phone first)

Route `/admin`, Supabase email and password login, new sign-ups disabled. One owner account.

- **Orders**: list (newest first, filter by status), each row shows code, date, item count, total. Tapping opens the items. Buttons: fulfilled, cancelled, back to new. Search by code.
- **Earnings**: totals of fulfilled orders for today, this week, this month (Cairo time, by order date), plus order counts. Delivery fees are not included because they are not in the system.
- **Products**: list with search and category filter; add, edit, delete. Form fields match section 3. Quick switches for available and featured from the list. Photo from camera or gallery.
- **Categories**: edit name, picture, order.
- **Settings**: every field in the settings table.

**Image upload**: the browser resizes each photo and converts it to WebP in two sizes before upload: card (about 400 px, target under 40 KB) and detail (about 1000 px, target under 150 KB). Uploaded to a public-read bucket; only the owner can write. Replacing or deleting a product deletes its old files.

## 7. Security

- Row Level Security on every table.
  - Public (anon): read categories, products, settings. No access to orders or order_items.
  - Owner (authenticated, matched by user id): full access.
- Orders are created only by the `createOrder` server function, using the Supabase service key kept as a Cloudflare secret. The browser never writes orders directly.
- Server limits: at most 50 distinct items, quantity 1 to 99 each, order rejected if nothing is available.
- Order code: 6 characters from an alphabet with no look-alikes (no 0/O, 1/I/L), generated on the server, unique constraint, retry on collision.
- No secrets in the client bundle except the Supabase anon key and the Turnstile site key, which are public by design.

## 8. Edge cases

| Concurrent operations | Partial failures | Abuse paths |
|---|---|---|
| Two order requests get the same random code: unique constraint on `orders.code`, server retries up to 5 times. | Order saved but WhatsApp never opened or message not sent: order stays `new`, owner cancels it. Earnings count only `fulfilled`. | Edited prices in the browser or in the WhatsApp text: the server recalculates from the DB; the owner checks the code against the dashboard total. |
| Owner edits a product while a customer orders it: the order uses the price read inside the same server call; the line is snapshotted. | Order insert succeeds but items insert fails: both happen in one Postgres function (`create_order`) in a single transaction, so nothing half-saved exists. | Bots flooding orders: Turnstile on `createOrder`; item and quantity caps. |
| Owner taps "fulfilled" twice or in two tabs: status update is a plain set, so the result is the same. | Photo uploaded but product save fails: the form deletes the just-uploaded files on failure; a missed orphan only costs storage. | Someone tries to read orders: RLS denies anon; only the owner's user id can select. |
| Sale ends or Friday ends while a cart is open: price is recomputed at order time; the WhatsApp message uses the server price. | Supabase paused or down: catalog shows a friendly error with the WhatsApp number from built-in defaults so customers can still reach the shop. | Someone signs up as admin: sign-ups disabled; RLS checks the owner's user id, not just "logged in". |
| Product deleted while in someone's saved cart: cart marks it unavailable and excludes it. | Turnstile script fails to load: checkout shows "حاول تاني بعد شوية أو كلمنا على واتساب" with the WhatsApp link. | Bucket abuse: only the owner can write to storage; public can only read. |

Invariants and where each is enforced:
- Saved prices match DB prices at order time: inside `create_order` (reads products and inserts in one transaction).
- Order code is unique: unique index on `orders.code`.
- No customer data stored: the `orders` and `order_items` tables have no columns for it; the server function never receives form fields.
- Only the owner changes data: RLS policies keyed on the owner's user id.

## 9. Placeholders until the owner provides them

WhatsApp number, phone, address, map location, delivery areas, Facebook and Instagram links (current fake values stay visible), real products, photos and prices. All except products are editable from the settings page; products are entered through the admin.

## 10. Build order (detailed plan comes after approval)

1. TanStack Start project on Cloudflare Workers with the current design ported, static data still local.
2. Supabase schema, RLS, seed from current data, keepalive job.
3. Catalog reading from Supabase, pricing function with tests.
4. Cart persistence, checkout, `createOrder`, Turnstile, WhatsApp message.
5. Admin: login, products and image upload, categories.
6. Admin: orders, earnings, settings.
7. Home page additions (how to order, العروض, Friday section, مختارات لك, زورنا).
8. Gates, security review, deploy to workers.dev.

## 11. Open questions

None blocking. Real shop data (section 9) can arrive any time after launch.
