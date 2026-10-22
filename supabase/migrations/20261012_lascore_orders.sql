-- LASCORE Orders: tamper-proof payment evidence + automatic audit trail.
-- Run after 20261001_lascore_phase1.sql and 20261011_alinmapay_payments.sql. Safe to re-run.

-- Safety guard: these changes only make sense on a database where LASCORE (20261001_lascore_phase1.sql) is
-- installed. If it is not, stop before touching any table that might belong to another app. Nothing is changed.
do $$
begin
  if not exists (
    select 1 from pg_type ty join pg_namespace n on n.oid = ty.typnamespace
    where n.nspname = 'public' and ty.typname = 'lascore_role'
  ) or to_regclass('public.orders') is null then
    raise exception 'LASCORE is not installed in this database: run 20261001_lascore_phase1.sql first. Nothing was changed.';
  end if;
end $$;

-- 1) Fast lookups for the paid / needs-review lists and the dashboard.
create index if not exists orders_payment_status_paid_at_idx on public.orders (payment_status, paid_at desc);

-- 2) Staff (role 'user') may change ONLY the fulfilment fields. Before this, staff could edit every column except
--    four, which after the payments migration would include the payment evidence (reference, paid_at, gateway label,
--    response code). An allow-list is used so any column added later is locked by default.
--    Admins keep full control (they resolve "needs review" orders); every such change is audited below.
create or replace function public.lascore_restrict_user_order_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.lascore_current_role() = 'user' then
    if (to_jsonb(new) - array['order_status', 'shipping_status', 'tracking_number', 'updated_at'])
       is distinct from
       (to_jsonb(old) - array['order_status', 'shipping_status', 'tracking_number', 'updated_at'])
    then
      raise exception 'Staff can only change order status, shipping status and tracking number';
    end if;
  end if;
  return new;
end;
$$;

-- 3) Automatic audit trail, written by the database itself so the UI cannot skip it. Records who changed payment,
--    order or shipping status (user_id is null when the store's payment server did it) and the old -> new values.
create or replace function public.lascore_audit_order_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.audit_logs (user_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'order.update',
    'order',
    new.order_number,
    jsonb_strip_nulls(jsonb_build_object(
      'source', case when auth.uid() is null then 'system' else 'dashboard' end,
      'payment_status', case when old.payment_status is distinct from new.payment_status
                             then jsonb_build_array(old.payment_status, new.payment_status) end,
      'order_status', case when old.order_status is distinct from new.order_status
                           then jsonb_build_array(old.order_status, new.order_status) end,
      'shipping_status', case when old.shipping_status is distinct from new.shipping_status
                              then jsonb_build_array(old.shipping_status, new.shipping_status) end,
      'tracking_number', case when old.tracking_number is distinct from new.tracking_number
                              then jsonb_build_array(old.tracking_number, new.tracking_number) end
    ))
  );
  return new;
end;
$$;

drop trigger if exists orders_audit_changes on public.orders;
create trigger orders_audit_changes
after update on public.orders
for each row
when (
  old.payment_status is distinct from new.payment_status
  or old.order_status is distinct from new.order_status
  or old.shipping_status is distinct from new.shipping_status
  or old.tracking_number is distinct from new.tracking_number
)
execute function public.lascore_audit_order_changes();
