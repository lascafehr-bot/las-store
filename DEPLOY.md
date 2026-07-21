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
