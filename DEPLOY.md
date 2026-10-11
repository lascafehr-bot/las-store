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
| `SITE_URL` | public https origin, e.g. `https://shop.lascafe.sa` (local preview: `http://localhost:8788`) |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase project; the service-role key is a secret |

Run `npm run check:payments` to see which settings are present, by name only (no values are printed).

**Keep sandbox and live apart.** In Cloudflare Pages, put the sandbox values only under the **Preview**
environment and leave **Production** without them until go-live. Use a separate *test* Supabase project
for sandbox runs so test orders never mix with real customers. Orders record `alinmapay-sandbox` or
`alinmapay` in `orders.payment_gateway`.

### Database (once per Supabase project)

Run `supabase/migrations/20261001_lascore_phase1.sql`, then `supabase/migrations/20261011_alinmapay_payments.sql`
in the SQL editor. Order states: `pending`, `paid`, `failed`, `cancelled`, and `review` (needs a person):
`payment_response_code` says why — `MISMATCH` (order/amount/terminal/transaction did not match),
`BAD_SIGNATURE` (AlinmaPay's response signature was missing or did not verify — a payment is never accepted without a valid one), `DUPLICATE_PAYMENT` (same cart paid twice: refund one). `failed` + `INIT_FAILED`
means the gateway rejected the request and nothing was charged.

### Sandbox test (local, nothing is deployed)

0. Needs **Node.js 22 or newer** (`node -v`) — Cloudflare's `wrangler` requires it — and `npm ci` once in the project folder.
1. Create a **test** Supabase project and run the two migrations above.
2. `copy .dev.vars.example .dev.vars` and fill it in: `ALINMAPAY_ENV=sandbox`, the sandbox credentials,
   `SITE_URL=http://localhost:8788`, the test Supabase URL and service-role key.
3. `npm run check:payments` — fix every FAIL.
4. `npm run preview` (`next dev` does **not** run `/functions`), open http://localhost:8788, add a product, check out.
5. On AlinmaPay's page use the sandbox test card: `4111 1111 1111 1111`, CVV `100`, expiry `01/39`
   (or `5123 4500 0000 0008`).
6. Expected: you return to the confirmation page showing *Order confirmed*, the cart is empty, and in Supabase the
   order is `paid` with gateway `alinmapay-sandbox`. (If the signature check fails you will see *Order under review* instead — see step 8.)
7. Repeat for: cancel on the payment page (→ `cancelled`), a failed/declined payment (→ `failed`), closing the tab
   after paying and checking out the same cart again (→ takes you to the already-paid order, no second charge).
8. Watch the terminal running `npm run preview`: each Inquiry logs `alinmapay signature check order=… valid=true|false`.
   `valid=true` is required for an order to become `paid`. If you see `valid=false` (order goes to `review` / `BAD_SIGNATURE`),
   copy that single log line to the developer and AlinmaPay: when another formula matched it adds `otherFormulaMatched=[…]`
   (names only, no values), which says exactly what AlinmaPay's signature is built from.

If creating the payment fails, the terminal prints the gateway's code. Common ones: `201`/`202` terminal or merchant
not found on this endpoint, `225`/`609` wrong terminal password, `904` signature/merchant-key problem,
`221`/`608`/`615` address check (AVS) fields required, `248` server IP not allowed, `304`/`305` currency not enabled.

### Going live checklist

- Sandbox runbook above passes with `valid=true` on real answers.
- Production credentials set **only** in Cloudflare's Production environment, with `ALINMAPAY_ENV=production` and the
  exact production `ALINMAPAY_PAY_REQUEST_URL`; `SITE_URL` is the https store address; real Supabase project migrated.
- AlinmaPay has confirmed whether the terminal needs an allow-listed server IP (code 248) — Cloudflare Workers have no
  fixed outbound IP — and whitelisted the receipt URL domain if required.
- A Cloudflare rate-limiting rule covers `/api/payments/*`.
- One small real payment is made and checked in Supabase (`paid`, gateway `alinmapay`).
- Deploy with `npm run deploy` only on Cloudflare Pages (Netlify cannot run these functions).
