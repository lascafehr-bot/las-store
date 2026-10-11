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
`paid` / `failed` / `cancelled` → `/order/confirmation` shows the verified status.

### One-time setup

1. **Database:** run `supabase/migrations/20261011_alinmapay_payments.sql` in the Supabase SQL editor
   (after `20261001_lascore_phase1.sql`).
2. **Cloudflare Pages → Settings → Variables and Secrets** (add as *Secret*, never `NEXT_PUBLIC_`):

   | Name | Value |
   |---|---|
   | `ALINMAPAY_MERCHANT_KEY` | merchant key from AlinmaPay |
   | `ALINMAPAY_TERMINAL_ID` | terminal id |
   | `ALINMAPAY_TERMINAL_PASSWORD` | terminal password |
   | `ALINMAPAY_PAY_REQUEST_URL` | leave empty for the **sandbox**; production: `https://pg.alinmapay.com.sa/Transactions/v2/payments/pay-request` |
   | `SITE_URL` | public https origin, e.g. `https://shop.lascafe.sa` |
   | `SUPABASE_URL` | Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key (server only) |

3. Deploy with `npm run deploy` (the `functions/` folder is bundled automatically; `wrangler.jsonc`
   enables `nodejs_compat`, which the AES decryption needs).

### Test locally

```powershell
copy .dev.vars.example .dev.vars   # fill in the sandbox values; SITE_URL=http://localhost:8788
npm run preview                    # http://localhost:8788  (next dev does NOT run /functions)
```

Sandbox test cards (guide §11): `4111 1111 1111 1111` (Visa) or `5123 4500 0000 0008` (MasterCard),
CVV `100`, expiry `01/39`.

### Going live checklist

- Confirm the credentials are the **production** ones, then set `ALINMAPAY_PAY_REQUEST_URL` to the production URL.
- Ask AlinmaPay whether the terminal needs an allow-listed server IP (guide response code 248, "Invalid
  Merchant IpAddress"). Cloudflare Workers do not have a fixed outbound IP.
- Make one small real payment, then check the order in Supabase (`orders.payment_status = 'paid'`).
- Static hosting such as Netlify cannot run these functions; use Cloudflare Pages.
