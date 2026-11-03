-- READ-ONLY. Safe to run in the SQL editor of your REAL Supabase project: it only SELECTs from catalog views and
-- counts rows. It changes nothing.
--
-- THIS PROJECT IS SHARED with LAS Portal, a separate app. Run section 0 FIRST. If it lists any table, function,
-- trigger or type that LASCORE would create but that was NOT created by LASCORE, STOP and do not run any migration.

-- 0) COLLISION CHECK against the other app(s) in this project. Expect nothing LASCORE-owned yet on a first install.
-- 0a) every table in public, so you can see what the other app owns
select c.relname as table_name, c.relkind, c.relrowsecurity as rls_enabled
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r','p','v','m') order by c.relname;
-- 0b) generic names LASCORE uses (tables, enum type, functions)
select 'table' as kind, relname as name from pg_class c join pg_namespace n on n.oid=c.relnamespace
  where n.nspname='public' and relname in ('profiles','products','customers','orders','order_items','audit_logs')
union all select 'type', typname from pg_type t join pg_namespace n on n.oid=t.typnamespace
  where n.nspname='public' and typname in ('lascore_role')
union all select 'function', proname from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and (proname like 'lascore\_%' or proname in ('set_updated_at','handle_new_user','store_create_order'))
order by 1,2;
-- 0c) every trigger on auth.users (another app may already create profile rows from it)
select t.tgname, p.proname as function_name
from pg_trigger t join pg_proc p on p.oid = t.tgfoid
where t.tgrelid = 'auth.users'::regclass and not t.tgisinternal;
-- 0d) columns of the generic-named tables, if they exist (to compare with LASCORE's)
select table_name, column_name, data_type from information_schema.columns
where table_schema='public' and table_name in ('profiles','products','audit_logs') order by table_name, ordinal_position;

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

-- 9) The staff order-update rule as it is today (20261012_lascore_orders.sql replaces this function; compare first)
select pg_get_functiondef(p.oid) as current_definition
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'lascore_restrict_user_order_updates';

-- 10) Triggers already present on orders (the audit trigger will be added next to them)
select tgname from pg_trigger where tgrelid = 'public.orders'::regclass and not tgisinternal;
