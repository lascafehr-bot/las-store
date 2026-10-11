-- READ-ONLY. Safe to run in the SQL editor of your REAL Supabase project: it only SELECTs from catalog views and
-- counts rows. It changes nothing. Purpose: confirm the real schema matches what the payments migration assumes,
-- before that migration is ever applied. Copy the results back so they can be compared.

-- 1) Do the LASCORE tables exist, and with how many columns?
select table_name, count(*) as columns
from information_schema.columns
where table_schema = 'public' and table_name in ('profiles','products','customers','orders','order_items','audit_logs')
group by table_name order by table_name;

-- 2) The orders table as it really is
select column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
order by ordinal_position;

-- 3) customers and order_items columns
select table_name, column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name in ('customers','order_items')
order by table_name, ordinal_position;

-- 4) Is order_number unique? (the payment code relies on it)
select indexname, indexdef from pg_indexes
where schemaname = 'public' and tablename = 'orders' and indexdef ilike '%order_number%';

-- 5) Row-level security and policies on the three tables the store writes to
select c.relname as table_name, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('orders','customers','order_items');
select tablename, policyname, cmd, roles from pg_policies
where schemaname = 'public' and tablename in ('orders','customers','order_items') order by tablename, policyname;

-- 6) Triggers on orders (the payment code updates payment_status as the server role)
select tgname from pg_trigger where tgrelid = 'public.orders'::regclass and not tgisinternal;

-- 7) Has any part of the payments migration already been applied?
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'orders'
  and column_name in ('payment_reference','payment_gateway','payment_response_code','paid_at','payment_checked_at','customer_notes','checkout_fingerprint');
select proname, pronargs from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and proname = 'store_create_order';

-- 8) Row counts only (no data is shown)
select (select count(*) from public.orders) as orders, (select count(*) from public.customers) as customers;
