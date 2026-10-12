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
| `SITE_URL` | public https origin, e.g. `https://shop.lascafe.sa` (local preview: `http://localhost:8788`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project; the service-role key is a secret |

Run `npm run check:payments` to see which settings are present, by name only (no values are printed).

**Keep sandbox and live apart.** Sandbox payments must never write into the real Supabase project (it is shared with
LAS Portal). Test against the **local test database** in `supabase/local-test` (free, runs on your PC). With
`ALINMAPAY_ENV=sandbox` the server refuses a hosted `SUPABASE_URL` unless `ALLOW_SANDBOX_ON_HOSTED_DB=true` is set
deliberately (only for a dedicated test project). In Cloudflare Pages keep sandbox values under **Preview** only.
Orders record `alinmapay-sandbox` or `alinmapay` in `orders.payment_gateway`.

### Database (real project, at go-live only)

Run `supabase/migrations/20261001_lascore_phase1.sql`, then `supabase/migrations/20261011_alinmapay_payments.sql`
in the SQL editor. Order states: `pending`, `paid`, `failed`, `cancelled`, and `review` (needs a person):
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
- Deploy with `npm run deploy` only on Cloudflare Pages (Netlify cannot run these functions).
