-- Las Café store (lascore) — dedicated project schema, Phase 1
-- Run this in the NEW Las Café Supabase project's SQL editor.

create extension if not exists "pgcrypto";

do $$ begin
  create type public.lascore_role as enum ('admin', 'user');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role public.lascore_role not null default 'user',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('admin', 'user'))
);

create unique index if not exists profiles_email_lower_idx on public.profiles (lower(email));

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null default 0,
  category text not null default '',
  image text not null default '',
  stock_quantity integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_price_nonnegative check (price >= 0),
  constraint products_stock_nonnegative check (stock_quantity >= 0)
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null default '',
  phone text not null default '',
  city text not null default '',
  address text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers (id),
  total_amount numeric(12, 2) not null default 0,
  payment_status text not null default 'pending',
  order_status text not null default 'new',
  shipping_status text not null default 'unfulfilled',
  tracking_number text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_total_nonnegative check (total_amount >= 0)
);

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_name text not null,
  quantity integer not null,
  unit_price numeric(12, 2) not null,
  subtotal numeric(12, 2) not null,
  constraint order_items_quantity_positive check (quantity > 0),
  constraint order_items_unit_price_nonnegative check (unit_price >= 0)
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
before update on public.orders
for each row execute function public.set_updated_at();

create or replace function public.lascore_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role = 'admin'
  );
$$;

create or replace function public.lascore_is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and is_active = true
      and role in ('admin', 'user')
  );
$$;

create or replace function public.lascore_current_role()
returns public.lascore_role
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.profiles
  where id = auth.uid()
    and is_active = true;
$$;

create or replace function public.lascore_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, is_active)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user',
    false
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.lascore_handle_new_user();

create or replace function public.lascore_restrict_user_order_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.lascore_current_role() = 'user' then
    if new.total_amount is distinct from old.total_amount
      or new.customer_id is distinct from old.customer_id
      or new.order_number is distinct from old.order_number
      or new.payment_status is distinct from old.payment_status
    then
      raise exception 'Users cannot change payment or pricing fields on orders';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists orders_restrict_user_updates on public.orders;
create trigger orders_restrict_user_updates
before update on public.orders
for each row execute function public.lascore_restrict_user_order_updates();

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles for select
to authenticated
using (id = auth.uid() or public.lascore_is_admin());

drop policy if exists profiles_admin_insert on public.profiles;
create policy profiles_admin_insert
on public.profiles for insert
to authenticated
with check (public.lascore_is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
on public.profiles for update
to authenticated
using (public.lascore_is_admin())
with check (public.lascore_is_admin());

drop policy if exists profiles_admin_delete on public.profiles;
create policy profiles_admin_delete
on public.profiles for delete
to authenticated
using (public.lascore_is_admin());

drop policy if exists products_staff_select on public.products;
create policy products_staff_select
on public.products for select
to authenticated
using (public.lascore_is_staff());

drop policy if exists products_admin_insert on public.products;
create policy products_admin_insert
on public.products for insert
to authenticated
with check (public.lascore_is_admin());

drop policy if exists products_admin_update on public.products;
create policy products_admin_update
on public.products for update
to authenticated
using (public.lascore_is_admin())
with check (public.lascore_is_admin());

drop policy if exists products_admin_delete on public.products;
create policy products_admin_delete
on public.products for delete
to authenticated
using (public.lascore_is_admin());

drop policy if exists customers_staff_select on public.customers;
create policy customers_staff_select
on public.customers for select
to authenticated
using (public.lascore_is_staff());

drop policy if exists customers_admin_insert on public.customers;
create policy customers_admin_insert
on public.customers for insert
to authenticated
with check (public.lascore_is_admin());

drop policy if exists customers_admin_update on public.customers;
create policy customers_admin_update
on public.customers for update
to authenticated
using (public.lascore_is_admin())
with check (public.lascore_is_admin());

drop policy if exists customers_admin_delete on public.customers;
create policy customers_admin_delete
on public.customers for delete
to authenticated
using (public.lascore_is_admin());

drop policy if exists orders_staff_select on public.orders;
create policy orders_staff_select
on public.orders for select
to authenticated
using (public.lascore_is_staff());

drop policy if exists orders_admin_insert on public.orders;
create policy orders_admin_insert
on public.orders for insert
to authenticated
with check (public.lascore_is_admin());

drop policy if exists orders_staff_update on public.orders;
create policy orders_staff_update
on public.orders for update
to authenticated
using (public.lascore_is_staff())
with check (public.lascore_is_staff());

drop policy if exists orders_admin_delete on public.orders;
create policy orders_admin_delete
on public.orders for delete
to authenticated
using (public.lascore_is_admin());

drop policy if exists order_items_staff_select on public.order_items;
create policy order_items_staff_select
on public.order_items for select
to authenticated
using (public.lascore_is_staff());

drop policy if exists order_items_admin_insert on public.order_items;
create policy order_items_admin_insert
on public.order_items for insert
to authenticated
with check (public.lascore_is_admin());

drop policy if exists order_items_admin_update on public.order_items;
create policy order_items_admin_update
on public.order_items for update
to authenticated
using (public.lascore_is_admin())
with check (public.lascore_is_admin());

drop policy if exists order_items_admin_delete on public.order_items;
create policy order_items_admin_delete
on public.order_items for delete
to authenticated
using (public.lascore_is_admin());

drop policy if exists audit_logs_admin_select on public.audit_logs;
create policy audit_logs_admin_select
on public.audit_logs for select
to authenticated
using (public.lascore_is_admin());

drop policy if exists audit_logs_staff_insert_own on public.audit_logs;
create policy audit_logs_staff_insert_own
on public.audit_logs for insert
to authenticated
with check (public.lascore_is_staff() and user_id = auth.uid());

revoke all on table public.profiles from anon, public;
revoke all on table public.products from anon, public;
revoke all on table public.customers from anon, public;
revoke all on table public.orders from anon, public;
revoke all on table public.order_items from anon, public;
revoke all on table public.audit_logs from anon, public;

grant select, insert, update, delete on table public.profiles to authenticated;
grant select, insert, update, delete on table public.products to authenticated;
grant select, insert, update, delete on table public.customers to authenticated;
grant select, insert, update, delete on table public.orders to authenticated;
grant select, insert, update, delete on table public.order_items to authenticated;
grant select, insert on table public.audit_logs to authenticated;

grant execute on function public.lascore_is_admin() to authenticated;
grant execute on function public.lascore_is_staff() to authenticated;
grant execute on function public.lascore_current_role() to authenticated;
