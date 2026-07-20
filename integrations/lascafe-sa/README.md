# Add «متجر لاس» box to lascafe.sa

[lascafe.sa](https://lascafe.sa/) is a **WordPress + Elementor** site (TaraTech).  
The store (`lass` project) is separate — you add a **link box** on the main site that opens the store.

---

## What to add on lascafe.sa

A third box next to **Bonat** and **Catering**, same style:

| Arabic | English | Button | Link |
|--------|---------|--------|------|
| متجر لاس | LAS Store | تسوّق الآن — Shop Now | **Store URL** (see below) |

**Suggested store URL** (after deploy):

- `https://store.lascafe.sa`  
  or  
- `https://las-store.vercel.app` (demo)

---

## Option A — Elementor (recommended, matches Bonat/Catering)

1. Log in to **WordPress admin** for lascafe.sa (or ask TaraTech).
2. Edit the **homepage** with Elementor.
3. Find the section with **Bonat** and **Catering** boxes.
4. **Duplicate** one of those boxes (same `blur` container).
5. Change:
   - **Heading:** `متجر لاس | LAS Store`
   - **Button text:** `تسوّق الآن — Shop Now`
   - **Link:** your store URL (opens in same tab or new tab — your choice)
6. Update the grid so 3 boxes show nicely (Bonat · Catering · Store).
7. **Publish**.

---

## Option B — HTML widget (if TaraTech prefers code)

Paste the contents of `store-box-snippet.html` into an **Elementor HTML widget**, or send the file to TaraTech.

Update `STORE_URL` inside the file before publishing.

---

## Option C — Send to TaraTech

Forward this folder to TaraTech with:

- Store URL
- Product image (optional): `/public/products/las-mug/grey-front.png` or LAS logo from lascafe.sa
- Text: same as Bonat/Catering layout

---

## Before the demo — checklist

1. **Deploy the store** (Vercel/Netlify) and get a live URL.
2. **Add the box** on lascafe.sa pointing to that URL.
3. **Test on mobile** — tap box → store opens → product → WhatsApp.
4. Confirm **prices** with LAS team (currently placeholder in demo).

---

## Files

- `store-box-snippet.html` — standalone box HTML/CSS (preview or embed)
- `store-box-elementor-copy.txt` — short copy-paste text for TaraTech
