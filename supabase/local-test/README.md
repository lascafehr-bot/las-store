# Local test database (zero cost, touches nothing real)

Sandbox payments need somewhere to store orders, but your only Supabase project is shared with the public store and
LAS Portal. This kit runs a **throw-away copy on your own computer** so a Sandbox test can never write into it.

It starts three containers, reachable only from your PC (127.0.0.1):

| Container | What it is |
|---|---|
| `db` | PostgreSQL 17. On first start it runs `00-supabase-compat.sql` (Supabase's roles/auth stubs) and then **the repo's real migrations** (`20261001_lascore_phase1.sql`, `20261011_alinmapay_payments.sql`). |
| `postgrest` | The real PostgREST, the same REST layer Supabase uses in front of Postgres. |
| `gateway` | nginx mapping `/rest/v1/*` to PostgREST, so the store talks to `http://127.0.0.1:54321` exactly as it talks to Supabase. |

## Start / stop (Windows)

Needs Docker (Docker Desktop, or Docker Engine inside WSL2). Docker Desktop is free for personal use and for small
businesses (check Docker's current terms); Docker Engine in WSL2 is free for everyone.

```powershell
cd supabase\local-test
docker compose up -d      # first start downloads ~350 MB of images
docker compose down -v    # stop AND erase all test data (fresh database next time)
```

## Point the store at it

In `.dev.vars` (copied from `.dev.vars.example`):

```
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_SERVICE_ROLE_KEY=<one of the two test keys below>
```

Both test keys are public throw-away values that only work against this local kit:

* legacy JWT style:
  `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoibGFzLWxvY2FsLXRlc3QifQ.XvqWlSf556CGeNi1_bqv61z45F_E_tU9qDYLF46sPFE`
* new `sb_secret_` style (apikey header only, as Supabase documents): `sb_secret_local_test_key`

Then `npm run check:payments` and `npm run preview`. Inspect the data with any SQL client on
`127.0.0.1:54329` (user `postgres`, password `local-test-postgres`, database `postgres`) or:

```powershell
docker compose exec db psql -U postgres -c "select order_number,payment_status,payment_gateway from orders order by created_at desc limit 10;"
```

## Safety net in the code

With `ALINMAPAY_ENV=sandbox` the server **refuses to start a payment** if `SUPABASE_URL` is a hosted database, unless
`ALLOW_SANDBOX_ON_HOSTED_DB=true` is set deliberately. `ALINMAPAY_ENV=production` refuses a local database.

## What this kit can and cannot prove

Proven here (it is the real Postgres + PostgREST + your real migrations): the migrations install and re-run cleanly;
the store's REST calls (filters, `or=`, `gte.`, RPC, `return=representation`) behave; the server role can create and
settle orders while the public `anon` key, and logged-in users without a staff profile, can read, create or change
nothing; duplicate order numbers roll back.

**Cannot be proven without a real Supabase project** (do not guess; see the list in the pull request):

1. Supabase's hosted API gateway: how it treats `sb_secret_…` vs legacy JWT keys. The gateway here is an emulation of
   the documented behaviour.
2. Your real production schema: it may differ from the migration files (columns or policies added by hand). Run
   `verify-production-schema.sql` (read-only) in the Supabase SQL editor and compare.
3. Applying the payments migration to the production project (it alters the shared `orders` table).
4. LAS Portal: how it displays the new statuses (`pending`, `review`, …) and new columns, and that unpaid checkout
   attempts will now appear as pending orders in the shared tables. The Portal's code is not in this repository.
5. Hosted limits and operations: project pausing after inactivity on the Free plan, backups (the Free plan has none),
   connection limits, latency, and the real production data volume.
