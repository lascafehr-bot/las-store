# Share preview with the team (5 minutes)

Deploy once, send the link on WhatsApp. **Not** the final production site yet.

## Fastest: Netlify

Run in PowerShell **from this folder**:

```powershell
cd C:\Users\d7omy\lass
npx netlify-cli login
```

Browser opens → log in (free account) → allow access.

Then:

```powershell
npx netlify-cli init
```

- **Create & configure a new project** → Yes  
- Site name: e.g. `las-store-demo` (pick any free name)  
- Build command: `npm run build` (default)  
- Publish: press Enter for default (Next.js)

Then:

```powershell
npx netlify-cli deploy --prod
```

Copy the **Production URL**, e.g. `https://las-store-demo.netlify.app`

Send that link to the team.

---

## Alternative: Vercel

```powershell
cd C:\Users\d7omy\lass
npx vercel login
npx vercel --prod
```

---

## What to tell the team (Arabic)

> هذه نسخة عرض للمتجر — الطلب والدفع عبر الموقع (تجريبي).  
> واتساب للمتابعة بعد الطلب فقط.  
> الرابط: [YOUR URL]

---

## After team approval

- Connect real payment (Moyasar / Tap)  
- Custom domain: `store.lascafe.sa`  
- Add box on [lascafe.sa](https://lascafe.sa/) pointing to the store  

---

## Online payments (AlinmaPay)

Card payment uses AlinmaPay's **hosted payment page** (API Specification v3.7). The browser never sees
any secret: the store's `functions/` folder (Cloudflare Pages Functions) talks to AlinmaPay.

Flow: checkout → `POST /api/payments/create` (server re-prices the cart, saves a *pending* order, requests
a payment id) → customer pays on AlinmaPay's page → AlinmaPay posts the encrypted result to
`/api/payments/callback` → the server asks AlinmaPay (Inquiry) for the real result → order becomes
`paid` / `failed` / `cancelled` / `review` → `/order/confirmation` shows the verified status.

### Settings (server-side only — Cloudflare secrets or local `.dev.vars`; never `NEXT_PUBLIC_`)

| Name | Value |
|---|---|
| `ALINMAPAY_ENV` | **`sandbox`** or **`production`** — required, no default |
| `ALINMAPAY_MERCHANT_KEY`, `ALINMAPAY_TERMINAL_ID`, `ALINMAPAY_TERMINAL_PASSWORD` | the credentials for that environment (AlinmaPay: same API, different keys per environment) |
| `ALINMAPAY_PAY_REQUEST_URL` | sandbox: optional (guide's sandbox URL is used if empty). **Production: required**, the exact endpoint AlinmaPay gave you |
| `ALINMAPAY_MERCHANT_IP` | IP address of the server that calls AlinmaPay, sent as `merchantIp` on the Transaction Inquiry. Without it the sandbox answers `622 Invalid IP Address` and paid orders go to `review`. Sandbox: optional but recommended. **Production: required** (the server refuses to start without it). AlinmaPay confirmed that any correctly formatted IP address is accepted in production, as in the sandbox (no fixed or allow-listed IP is needed) |
| `RESEND_API_KEY` (**secret**), `EMAIL_FROM`, `ORDER_ALERT_EMAIL` | order emails through [Resend](https://resend.com): `EMAIL_FROM` like `LAS CAFE <orders@lascafe.sa>` (the domain must be verified in Resend), `ORDER_ALERT_EMAIL` is where the owner alert goes. Optional locally (nothing is sent without the key); `npm run check:payments` fails in production if they are missing |
| `SITE_URL` | public https origin, e.g. `https://shop.lascafe.sa` (local preview: `http://localhost:8788`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project; the service-role key is a secret |

Run `npm run check:payments` to see which settings are present, by name only (no values are printed).

**Keep sandbox and live apart.** Sandbox payments must never write into the real Supabase project (it is shared with
LAS Portal). Test against the **local test database** in `supabase/local-test` (free, runs on your PC). LAS Portal is a separate app that only shares this Supabase project; before any migration, run
section 0 of `supabase/local-test/verify-production-schema.sql` (read-only) and review it. The migrations abort without
changes if they find same-named tables they did not create. With
`ALINMAPAY_ENV=sandbox` the server refuses a hosted `SUPABASE_URL` unless `ALLOW_SANDBOX_ON_HOSTED_DB=true` is set
deliberately (only for a dedicated test project). In Cloudflare Pages keep sandbox values under **Preview** only.
Orders record `alinmapay-sandbox` or `alinmapay` in `orders.payment_gateway`.

### Database (real project, at go-live only)

Run `supabase/migrations/20261001_lascore_phase1.sql`, then `supabase/migrations/20261011_alinmapay_payments.sql`,
then `supabase/migrations/20261012_lascore_orders.sql` in the SQL editor (the last one replaces the staff order-update
rule so staff can change only fulfilment fields, and adds the automatic audit trail — run
`supabase/local-test/verify-production-schema.sql` first and compare). Order states: `pending`, `paid`, `failed`, `cancelled`, and `review` (needs a person):
`payment_response_code` says why — `MISMATCH` (order/amount/terminal/transaction did not match),
`BAD_SIGNATURE` (no valid signature evidence — see below; a payment is never accepted without one), `DUPLICATE_PAYMENT` (same cart paid twice: refund one),
or a **gateway code such as `619`, `622`, `225`, `248`** (the gateway rejected *our inquiry request* or the terminal setup, so
the payment's real result is unknown and the customer may have been charged: check it in AlinmaPay's dashboard
(Transactions) and fix the cause, then settle the order by hand). `failed` + `INIT_FAILED`
means the gateway rejected the request and nothing was charged.

**What makes an order `paid`** (all must hold): the Inquiry answers `SUCCESS`/`000` and its order id, terminal id,
transaction id and amount match our order, **and** there is a valid signature from one of two sources: the Inquiry
response's own signature, or the receipt's signature. The receipt signature (`PaymentId|merchantKey|responseCode|amount`,
guide §6) is verified in `/api/payments/callback` and only trusted if its transaction id equals the one saved when the
payment was created, its code is `000` and its amount equals the order total. In the real sandbox the Inquiry
response's signature does **not** validate under the documented formula, but the receipt's does, so paid orders are
confirmed through the receipt. A payment confirmed only through the status page (callback never arrived) has no receipt
and lands in `review`. Which codes count as "our request was rejected" is in `INQUIRY_REQUEST_ERROR_CODES`
(`functions/_lib/alinmapay.ts`).

### Order emails

When an order really becomes `paid` or `review` the server sends (once per order, even if AlinmaPay calls back several
times): an **alert to `ORDER_ALERT_EMAIL`** with the order, items and customer details (for `review` it also shows the gateway
code; check the payment in AlinmaPay's dashboard first, because the customer may have been charged), and, for `paid` orders
whose customer gave an email, a **payment receipt** to the customer. The receipt says it is *not a tax invoice*.
Nothing is sent for `failed` or `cancelled` orders. An email problem is logged by order number only and never changes a
payment. Set it up: create a Resend account, add and verify `lascafe.sa` (Resend shows the DNS records; add them in
Cloudflare DNS), create an API key, then add the three settings above in Cloudflare Production.

### Sandbox test (local, nothing is deployed, nothing real is touched)

0. Needs **Node.js 22 or newer** (`node -v`, Cloudflare's `wrangler` requires it), **Docker** (Docker Desktop, or Docker Engine
   in WSL2), and `npm ci` once in the project folder.
1. Start the local test database: `cd supabase\local-test`, then `docker compose up -d` (details and test keys in
   `supabase/local-test/README.md`). It runs the repo's real migrations on a throw-away database.
2. `copy .dev.vars.example .dev.vars` and fill it in: `ALINMAPAY_ENV=sandbox`, the sandbox credentials,
   `SITE_URL=http://localhost:8788`, `SUPABASE_URL=http://127.0.0.1:54321`, and the **test** key from the kit's README.
3. `npm run check:payments` — fix every FAIL.
4. `npm run preview` (`next dev` does **not** run `/functions`), open http://localhost:8788, add a product, check out.
5. On AlinmaPay's page use the sandbox test card: `4111 1111 1111 1111`, CVV `100`, expiry `01/39`
   (or `5123 4500 0000 0008`).
6. Expected: you return to the confirmation page showing *Order confirmed*, the cart is empty, and in the local database the
   order is `paid` with gateway `alinmapay-sandbox` (from `supabase\local-test`: `docker compose exec db psql -U postgres -c "select order_number,payment_status,payment_gateway from orders order by created_at desc limit 5;"`). (If the signature check fails you will see *Order under review* instead — see step 8.)
7. Repeat for: cancel on the payment page (→ `cancelled`), a failed/declined payment (→ `failed`), closing the tab
   after paying and checking out the same cart again (→ takes you to the already-paid order, no second charge).
8. Watch the terminal running `npm run preview`. A paid order logs three lines (no secrets, booleans only):
   `alinmapay receipt check … signatureValid=true verified=true`, `alinmapay inquiry … result=SUCCESS code=000`, and
   `alinmapay signature check … valid=false receiptVerified=true` (the Inquiry's own signature is expected to be `false`
   in the sandbox; `receiptVerified=true` is what lets the order become `paid`). If `verified=false` the order goes to
   `review` / `BAD_SIGNATURE`: copy those log lines (names and booleans only) to the developer and AlinmaPay.
9. Offline checks, no network or payment needed: `npm run test:payments` runs the failure scenarios (declined, cancelled,
   duplicate callbacks, amount mismatch, bad signature, gateway errors...) against the real handlers with a fake database
   and gateway. Run it after any change to `functions/`.

If creating the payment fails, the terminal prints the gateway's code. Common ones: `201`/`202` terminal or merchant
not found on this endpoint, `225`/`609` wrong terminal password, `904` signature/merchant-key problem,
`221`/`608`/`615` address check (AVS) fields required, `248` server IP not allowed, `304`/`305` currency not enabled.

### Shipping (Aramex)

An active staff member creates the Aramex shipment for a **paid** order: `POST /api/shipping/create` with `{ orderNumber }`
(optionally `weightKg` and `city` to correct what Aramex rejected) and the staff member's Supabase access token in
`Authorization: Bearer …`. It saves the tracking number in `orders.tracking_number`, moves `shipping_status` to `packed` and returns the
label link. `POST /api/shipping/label` gives a fresh label link for an existing shipment. Nothing is created automatically.

Safety rules (all covered by `npm run test:aramex`): staff only; paid orders only; **one shipment per order** (the order is claimed in
the database first, so two clicks create one shipment); if Aramex refuses, the claim is given back and Aramex's message is shown;
a **test (sandbox) payment can never create a real shipment** when `ARAMEX_ENV=production`; `ARAMEX_ENV=production` is refused on a
local address; secrets, customer phone and address are never logged.

Settings (all **Secret** on Cloudflare, see the `.dev.vars.example` list): `ARAMEX_ENV` (`uat` = Aramex's test system, which needs the
caller's IP whitelisted by Aramex, or `production`, which needs no whitelisting), `ARAMEX_USERNAME`, `ARAMEX_PASSWORD`,
`ARAMEX_ACCOUNT_PIN`, `ARAMEX_ACCOUNT_NUMBER`, `ARAMEX_ENTITY`, `ARAMEX_SHIPPER_NAME/PHONE/EMAIL/CITY/ADDRESS` (where the parcels are collected).
Two values still to be confirmed by Aramex and changeable without code: `ARAMEX_PRODUCT_TYPE` (default `ONP`; their documents also show
`CDS` and `OND`) and `ARAMEX_LABEL_REPORT_ID` (default `9729`; also `9201`).

**Buttons:** in LASCORE, Orders, an open paid order has **Create Aramex shipment** (asks to confirm first) while it has no tracking number,
and **Print Aramex label** once it has an Aramex one (plain digits; a hand-typed number from another carrier gets no Aramex button).
When the shipment is created the customer is emailed the tracking number (live-payment orders only, valid email only; an email problem
never undoes the shipment).

**Testing before going live.** Aramex's test system (`uat`) accepts only whitelisted IPs, and Cloudflare has no fixed IP, so the first test
runs from a computer whose public IPv4 Aramex whitelisted (`curl -4 https://api.ipify.org` shows it). After that test Aramex sends the real
API username and password; put them in Cloudflare with the account PIN, set `ARAMEX_ENV=production` and redeploy. The store's account is
**B2C** (75829154, entity RUH); the B2B account (75829159) is for wholesale and must not be used here. For the first live shipment tell Aramex
it is a test and ask them to cancel it without charge.

Database: run `supabase/migrations/20261102_service_role_grants.sql` once (gives the server key the table permissions it needs, including
`profiles` for the staff check). The weight is read from the item names ("250غم", "1كغم") plus packaging (`ARAMEX_PACKAGING_KG`, default 0.15).
Only the cities Aramex's own samples spell out (Riyadh, Jeddah, Dammam, Makkah) are translated from Arabic; any other city is sent as typed
and Aramex's answer tells the admin to correct it.

### Going live checklist

- Sandbox runbook above passes (`verified=true` on the receipt check) and `npm run test:payments` is green.
- `ALINMAPAY_MERCHANT_IP` is set in Production to any correctly formatted IP address (AlinmaPay confirmed this is
  enough, as in the sandbox; no fixed or allow-listed IP is needed), and AlinmaPay has confirmed what the formula of
  the Inquiry response signature is.
- Production credentials set **only** in Cloudflare's Production environment, with `ALINMAPAY_ENV=production` and the
  exact production `ALINMAPAY_PAY_REQUEST_URL`; `SITE_URL` is the https store address; real Supabase project migrated.
- AlinmaPay has confirmed whether the receipt URL domain must be registered, and it is registered if required.
- A Cloudflare rate-limiting rule covers `/api/payments/*`.
- One small real payment is made and checked in Supabase (`paid`, gateway `alinmapay`).
- Checkout accepts only a valid Saudi mobile number (`lib/phone.ts`, checked in the form and again on the server) so the courier can call the customer.
- Keep the free Supabase project awake: an UptimeRobot **Keyword** monitor on `https://shop.lascafe.sa/api/health` (keyword `ok`, alert when it does
  not exist, every 5 minutes). `/api/health` asks the database one harmless question and answers 200 `{"status":"ok"}` or 503. Upgrading to
  Supabase Pro is the lasting fix.
- Admin screens: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (the **publishable** key) must be in the git-ignored `.env.local`
  **when `npm run deploy` builds** (they are baked into the static files; Cloudflare's settings do not provide them). Run
  `20261012_lascore_orders.sql` in Supabase. Staff need a Supabase user with an active profile.
- Email from `orders@lascafe.sa`: the three Resend DNS records (TXT `resend._domainkey`, CNAME `rsend`, CNAME `send`) must be added where the domain's
  DNS lives (t2.sa), then **Verify** in Resend, then change `EMAIL_FROM` and redeploy. Until then Resend only delivers to the Resend account's own email.
- Deploy with `npm run deploy` only on Cloudflare Pages (Netlify cannot run these functions).

### LASCORE orders (admin area)

LASCORE lists only what was actually bought: **paid** orders, plus a separate **needs review** tab for the rare orders
where money may have been taken but something did not match. Pending, failed and cancelled checkout attempts are never
listed and never counted. Staff can update shipping status and tracking only; marking a review order as paid and
recording refunds is admin-only (refunds themselves are made in AlinmaPay's portal). The database writes an audit
record for every payment, order and shipping status change. Preview with the local kit: `supabase/local-test/README.md`.
Offline checks for the screens' logic (review reasons, Saudi-time "today", WhatsApp links, CSV safety): `npm run test:lascore`.
