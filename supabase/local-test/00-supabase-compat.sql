-- LOCAL TEST ONLY. Recreates the parts of Supabase that the store's migrations and server code rely on
-- (roles, auth schema, default grants) so the real migrations can run on a plain PostgreSQL.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator noinherit login password 'local-test-authenticator';
grant anon, authenticated, service_role to authenticator;

create schema if not exists auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text);
create or replace function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;

grant usage on schema public, auth to anon, authenticated, service_role;
-- Supabase's defaults: new objects in public are reachable by the API roles (RLS and revokes then restrict them).
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
