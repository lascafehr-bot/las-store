# متجر لاس — LAS Store

Arabic product catalog for **LAS CAFE**. Customers browse products and order via WhatsApp — no checkout in the site.

Built with **Next.js**, **TypeScript**, and **Tailwind CSS**.

## Pages

- `/` — Home with featured products and categories
- `/products` — Full catalog with category filters
- `/products/[slug]` — Product detail + WhatsApp order button

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Configuration

Edit `lib/config.ts` for contact info, WhatsApp number, and branches.

Edit `lib/products.ts` to add or update products.

## Deploy on Netlify

Netlify supports Next.js 16 automatically — no extra plugin needed.

### Option A — GitHub + Netlify (recommended)

1. Create a new repo on GitHub (e.g. `las-store`).
2. In PowerShell, from the project folder:

```powershell
cd C:\Users\d7omy\lass
git add .
git commit -m "Initial LAS store"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/las-store.git
git push -u origin main
```

3. Go to [app.netlify.com](https://app.netlify.com) → **Add new site** → **Import an existing project**.
4. Connect GitHub and select the repo.
5. Netlify should detect **Next.js** automatically:
   - **Build command:** `npm run build`
   - **Publish directory:** leave default (Netlify sets this for Next.js)
6. Click **Deploy site**.
7. After deploy, copy the URL (e.g. `https://random-name.netlify.app`) and use it for the box on [lascafe.sa](https://lascafe.sa/).

**Custom domain (optional):** Site settings → Domain management → add `store.lascafe.sa`.

### Option B — Netlify CLI (no GitHub)

```powershell
npm install -g netlify-cli
cd C:\Users\d7omy\lass
netlify login
netlify init
netlify deploy --prod
```

---

## Related

- Main website: [lascafe.sa](https://lascafe.sa/) — add store link box (see `integrations/lascafe-sa/`)
- Employee portal: `las-website` (separate, internal)
