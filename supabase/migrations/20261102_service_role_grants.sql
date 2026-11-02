-- Table permissions for the store's server key (the Supabase "service_role").
-- New Supabase projects do NOT give service_role access to tables created through the SQL editor, so without this the
-- store's server answers "permission denied" (HTTP 403): payments need orders (read + update), the order emails read
-- customers and order_items, and the shipping staff check reads profiles.
-- These are the minimum permissions. Nothing is granted to anon or authenticated, and nothing is revoked. Safe to re-run.

do $$
begin
  if to_regclass('public.orders') is null or to_regclass('public.profiles') is null then
    raise exception 'LASCORE is not installed in this database: run 20261001_lascore_phase1.sql first. Nothing was changed.';
  end if;
end $$;

grant select, update on public.orders to service_role;
grant select on public.customers to service_role;
grant select on public.order_items to service_role;
grant select on public.profiles to service_role;
