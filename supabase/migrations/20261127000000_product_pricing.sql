alter table public.products
  add column sale_type text not null default 'none',
  add column sale_value integer,
  add column sale_starts_at timestamptz,
  add column sale_ends_at timestamptz,
  add column friday_type text not null default 'none',
  add column friday_value integer,
  add constraint products_sale_type_check check (sale_type in ('none', 'price', 'percent')),
  add constraint products_sale_value_check check (
    (sale_type = 'none' and sale_value is null)
    or (sale_type in ('price', 'percent') and sale_value is not null)
  ),
  add constraint products_sale_price_below_original check (sale_type <> 'price' or sale_value < price_egp),
  add constraint products_sale_percent_range check (sale_type <> 'percent' or sale_value between 1 and 90),
  add constraint products_sale_dates_order check (
    sale_starts_at is null or sale_ends_at is null or sale_starts_at < sale_ends_at
  ),
  add constraint products_friday_type_check check (friday_type in ('none', 'price', 'percent')),
  add constraint products_friday_value_check check (
    (friday_type = 'none' and friday_value is null)
    or (friday_type in ('price', 'percent') and friday_value is not null)
  ),
  add constraint products_friday_price_below_original check (friday_type <> 'price' or friday_value < price_egp),
  add constraint products_friday_percent_range check (friday_type <> 'percent' or friday_value between 1 and 90);
