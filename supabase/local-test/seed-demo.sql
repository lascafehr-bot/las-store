-- LOCAL TEST ONLY. Adds two demo staff accounts and a spread of demo orders so the LASCORE screens can be previewed.
-- Never run this on a real Supabase project. Usage (from this folder, PowerShell):
--   Get-Content seed-demo.sql | docker compose exec -T db psql -U postgres
-- Demo accounts: admin  aaaaaaaa-0000-0000-0000-000000000001   staff  bbbbbbbb-0000-0000-0000-000000000002

insert into auth.users (id, email) values
  ('aaaaaaaa-0000-0000-0000-000000000001', 'admin@demo.local'),
  ('bbbbbbbb-0000-0000-0000-000000000002', 'staff@demo.local')
on conflict (id) do nothing;
update public.profiles set role = 'admin', is_active = true, full_name = 'Demo Admin'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.profiles set role = 'user', is_active = true, full_name = 'Demo Staff'
  where id = 'bbbbbbbb-0000-0000-0000-000000000002';

create or replace function pg_temp.mk_order(
  p_no text, p_name text, p_phone text, p_city text, p_addr text, p_total numeric,
  p_pay text, p_gateway text, p_code text, p_ship text, p_tracking text,
  p_created_ago interval, p_paid boolean, p_items jsonb
) returns void language plpgsql as $$
declare c uuid; o uuid;
begin
  insert into public.customers (full_name, email, phone, city, address)
  values (p_name, '', p_phone, p_city, p_addr) returning id into c;
  insert into public.orders (order_number, customer_id, total_amount, payment_status, payment_gateway,
                             payment_response_code, payment_reference, shipping_status, tracking_number,
                             created_at, paid_at)
  values (p_no, c, p_total, p_pay, p_gateway, p_code,
          case when p_pay in ('paid','review','refunded') then '26' || right(p_no, 10) || '0000' else '' end,
          p_ship, p_tracking, now() - p_created_ago,
          case when p_paid then now() - p_created_ago + interval '3 minutes' end)
  returning id into o;
  insert into public.order_items (order_id, product_name, quantity, unit_price, subtotal)
  select o, i ->> 'n', (i ->> 'q')::int, (i ->> 'p')::numeric, (i ->> 'q')::int * (i ->> 'p')::numeric
  from jsonb_array_elements(p_items) i;
end $$;

select pg_temp.mk_order('LAS20261012D000000001','Sara Alharbi','0501112233','Riyadh','Olaya St, Building 12, Apt 4',105,'paid','alinmapay','000','unfulfilled','',interval '2 hours',true,'[{"n":"LAS Mug (Grey)","q":2,"p":29},{"n":"Hambela Natural (250g)","q":1,"p":47}]');
select pg_temp.mk_order('LAS20261012D000000002','Khalid Alotaibi','0553334455','Jeddah','Al Rawdah District, Villa 8',29,'paid','alinmapay','000','shipped','SMSA-778123',interval '1 day',true,'[{"n":"LAS Mug (Beige)","q":1,"p":29}]');
select pg_temp.mk_order('LAS20261012D000000003','Noura Alqahtani','0567778899','Dammam','King Fahd Rd 120',94,'paid','alinmapay','000','delivered','SMSA-551002',interval '4 days',true,'[{"n":"Monte Natural (250g)","q":2,"p":47}]');
select pg_temp.mk_order('LAS20261012D000000004','Test Buyer','0500000000','Riyadh','Test address',29,'paid','alinmapay-sandbox','000','unfulfilled','',interval '30 minutes',true,'[{"n":"LAS Mug (Grey)","q":1,"p":29}]');
select pg_temp.mk_order('LAS20261012D000000005','Mona Alshehri','0541239876','Makkah','Alaziziyah 33',58,'review','alinmapay','DUPLICATE_PAYMENT','unfulfilled','',interval '3 hours',false,'[{"n":"LAS Mug (Grey)","q":2,"p":29}]');
select pg_temp.mk_order('LAS20261012D000000006','Test Review','0500000001','Riyadh','Test address 2',29,'review','alinmapay-sandbox','BAD_SIGNATURE','unfulfilled','',interval '20 minutes',false,'[{"n":"LAS Mug (Beige)","q":1,"p":29}]');
select pg_temp.mk_order('LAS20261012D000000007','Abandoned Cart','0509990000','Riyadh','Never paid',29,'pending','alinmapay','','unfulfilled','',interval '5 hours',false,'[{"n":"LAS Mug (Grey)","q":1,"p":29}]');
select pg_temp.mk_order('LAS20261012D000000008','No Funds','0508881111','Riyadh','Declined',47,'failed','alinmapay','505','unfulfilled','',interval '6 hours',false,'[{"n":"Hambela Natural (250g)","q":1,"p":47}]');
select pg_temp.mk_order('LAS20261012D000000009','Changed Mind','0507772222','Jeddah','Cancelled',29,'cancelled','alinmapay','624','unfulfilled','',interval '7 hours',false,'[{"n":"LAS Mug (Grey)","q":1,"p":29}]');
select pg_temp.mk_order('LAS20261012D00000000A','Fatimah Alzahrani','0556663333','Riyadh','Refunded order',29,'refunded','alinmapay','000','unfulfilled','',interval '2 days',true,'[{"n":"LAS Mug (Beige)","q":1,"p":29}]');
