-- AlinmaPay online payments: payment columns + an atomic, server-only order-creation function.
-- Run after 20261001_lascore_phase1.sql. Safe to re-run.

alter table public.orders
  add column if not exists payment_reference text not null default '',
  add column if not exists payment_gateway text not null default '',
  add column if not exists payment_response_code text not null default '',
  add column if not exists paid_at timestamptz,
  add column if not exists payment_checked_at timestamptz,
  add column if not exists customer_notes text not null default '',
  add column if not exists checkout_fingerprint text;

-- Used to detect a customer paying twice for the same cart (same phone + items + total within 30 minutes).
create index if not exists orders_checkout_fingerprint_idx on public.orders (checkout_fingerprint, created_at desc);

-- payment_gateway is 'alinmapay' for live payments and 'alinmapay-sandbox' for sandbox ones, so test
-- payments can never be mistaken for real money.
-- payment_status values written by the store backend:
--   pending | paid | failed | cancelled | review
-- 'review' + payment_response_code: MISMATCH (order/amount/terminal/transaction did not match),
--   BAD_SIGNATURE (response signature missing or invalid), DUPLICATE_PAYMENT (same cart already paid).
-- 'failed' + INIT_FAILED: the gateway rejected the payment request, nothing was charged.

drop function if exists public.store_create_order(text, text, text, text, text, text, text, numeric, jsonb);

create or replace function public.store_create_order(
  p_order_number text,
  p_full_name text,
  p_email text,
  p_phone text,
  p_city text,
  p_address text,
  p_notes text,
  p_total numeric,
  p_fingerprint text,
  p_gateway text,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_id uuid;
  v_order_id uuid;
begin
  insert into public.customers (full_name, email, phone, city, address)
  values (p_full_name, coalesce(p_email, ''), coalesce(p_phone, ''), coalesce(p_city, ''), coalesce(p_address, ''))
  returning id into v_customer_id;

  insert into public.orders (order_number, customer_id, total_amount, payment_status, payment_gateway, customer_notes, checkout_fingerprint)
  values (p_order_number, v_customer_id, p_total, 'pending', coalesce(p_gateway, ''), coalesce(p_notes, ''), p_fingerprint)
  returning id into v_order_id;

  insert into public.order_items (order_id, product_name, quantity, unit_price, subtotal)
  select
    v_order_id,
    i->>'name',
    (i->>'quantity')::integer,
    (i->>'unit_price')::numeric,
    (i->>'quantity')::integer * (i->>'unit_price')::numeric
  from jsonb_array_elements(p_items) as i;

  return v_order_id;
end;
$$;

-- Only the backend (service role) may create store orders through this function.
revoke all on function public.store_create_order(text, text, text, text, text, text, text, numeric, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.store_create_order(text, text, text, text, text, text, text, numeric, text, text, jsonb) to service_role;
