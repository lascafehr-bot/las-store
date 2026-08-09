# LAS CAFE — Digital Projects Roadmap

**Document purpose:** Step-by-step plan for all customer-facing websites and systems.  
**Date:** August 2026  
**Status:** Planning & execution guide

---

## Overview

LAS CAFE will have **one main brand website** (Brew 92 style) that links to **three separate systems**, plus an **internal employee portal** that stays independent.

| # | Project | URL (planned) | Priority |
|---|---------|---------------|----------|
| 1 | Main website | lascafe.sa | **Start first** |
| 2 | LAS Store | store.lascafe.sa | Second |
| 3 | Table booking | booking.lascafe.sa (or similar) | Third |
| 4 | Catering & events | catering.lascafe.sa (or similar) | Fourth |
| — | Employee portal (internal) | portal.lascafe.sa | Separate — already exists |

**Reference design:** [Brew 92](https://www.brew92.com/)  
**Current booking (temporary):** [lascafe.bookatables.com](https://lascafe.bookatables.com/)

---

## Architecture

```
                    ┌─────────────────────────┐
                    │   MAIN WEBSITE (NEW)    │
                    │      lascafe.sa         │
                    │   Brew 92–style brand   │
                    └───────────┬─────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
   │  LAS STORE  │      │   BOOKING   │      │  CATERING   │
   │   متجر لاس   │      │    الحجز    │      │  الكيترنق   │
   └─────────────┘      └─────────────┘      └─────────────┘

   ┌─────────────┐
   │  EMPLOYEE   │  ← Internal only (not linked to public main site)
   │   PORTAL    │
   └─────────────┘
```

---

## Project folders & repos

Use **one folder (repo) per project**:

| Project | Folder name | Notes |
|---------|-------------|-------|
| Main website | `las-main` | Create new |
| LAS Store | `lass` | Demo exists on Netlify |
| Table booking | `las-booking` | Create when step 3 starts |
| Catering | `las-catering` | Create when step 4 starts |
| Employee portal | `las-website` | Already built — do not merge |

**Cursor:** Use a **new chat** when starting each project.

---

## Phase 1 — Main website (START HERE)

**Goal:** New company homepage similar to Brew 92, with links to Store, Booking, and Catering.

### Steps

1. Create folder: `C:\Users\d7omy\projects\las-main`
2. Open folder in Cursor → start new chat
3. Study Brew 92: layout, navigation, hero, locations, shop CTA, mobile
4. Define sitemap, for example:
   - Home
   - Our story / About
   - Locations / Branches
   - Menu (or link to PDF / section)
   - **Links section:** Store · Booking · Catering (3 prominent boxes)
   - Contact
5. Design: wireframes or direct build (RTL Arabic + English if needed)
6. Build with Next.js (recommended — same stack as store)
7. Match LAS branding: colors #003b49, #c68e65, logo, photos
8. Deploy to staging → then **lascafe.sa** (replace current WordPress when ready)
9. Add placeholder or live links to the three sub-systems

### Deliverable

Live main website with Brew 92 feel and three clear entry points.

---

## Phase 2 — LAS Store (متجر لاس)

**Goal:** Production store aligned with main site design; order & pay on website; WhatsApp for follow-up only.

### Current state

- Demo built in `lass` (Next.js)
- Products: مق LAS, محصول إثيوبي قوجي
- Cart, checkout, order confirmation (demo payment)
- Deployed on Netlify (preview)

### Steps

1. Open `lass` folder → new chat: “Store production”
2. Redesign UI to **match main website** (fonts, header, colors)
3. Confirm product list, prices, photos with LAS team
4. Integrate **payment gateway** (Moyasar / Tap / HyperPay)
5. Add **order backend** (e.g. Supabase) — save orders, optional admin
6. WhatsApp: **follow-up only** (confirm order, delivery, feedback)
7. Deploy to **store.lascafe.sa**
8. Link from main website

### Deliverable

Production e-commerce store linked from lascafe.sa.

---

## Phase 3 — Table booking (الحجز)

**Goal:** Own booking experience (replace or improve Bookatables).

### Current state

- External: lascafe.bookatables.com

### Steps

1. Define requirements with LAS:
   - Branches (Olaya, Malqa, Jeddah)
   - Party size, date/time, special requests
   - Confirmations (SMS / email / WhatsApp)
2. Create folder: `las-booking`
3. Design to match main website
4. Build booking flow + admin or calendar integration
5. Deploy (e.g. booking.lascafe.sa)
6. Update main website link (retire Bookatables when ready)

### Deliverable

Custom table booking system linked from main site.

---

## Phase 4 — Catering & events (الكيترنق والمناسبات)

**Goal:** Website for corporate events, catering orders, and inquiries.

### Steps

1. Define scope:
   - Menu / packages
   - Event inquiry form
   - Quote request workflow
   - Who receives leads (email / WhatsApp / admin)
2. Create folder: `las-catering`
3. Design to match main website
4. Build pages + forms (payment optional later)
5. Deploy (e.g. catering.lascafe.sa)
6. Link from main website

### Deliverable

Catering & events site linked from lascafe.sa.

---

## Order of work (summary)

```
1. Main website (Brew 92 style)     ← YOU ARE HERE
2. LAS Store (redesign + payment)
3. Table booking (develop / replace Bookatables)
4. Catering & events (new site)
```

**Do not start step 2 until step 1 design direction is clear.**  
**Employee portal (`las-website`) is managed separately.**

---

## Domains checklist (when launching)

| Domain | Project |
|--------|---------|
| lascafe.sa | Main website |
| store.lascafe.sa | LAS Store |
| booking.lascafe.sa | Table booking (TBD) |
| catering.lascafe.sa | Catering (TBD) |
| portal.lascafe.sa | Employee portal (existing) |

---

## Tech stack (recommended)

| Layer | Choice |
|-------|--------|
| Main site, Store, Booking, Catering | Next.js + TypeScript + Tailwind |
| Hosting | Netlify or Vercel |
| Store payments | Moyasar or Tap (Saudi) |
| Store orders / auth | Supabase (optional) |
| Employee portal | Existing HTML/JS + Supabase (las-website) |

---

## What NOT to do

- Do not merge all sites into one codebase (keep separate repos)
- Do not link employee portal on public main site
- Do not treat Netlify store demo as final production
- Do not skip main website — it is the hub for everything

---

## Next action (today)

1. Create `las-main` folder  
2. New Cursor chat  
3. Start main website using Brew 92 as reference  
4. Plan three link boxes: Store · Booking · Catering  

---

**LAS CAFE — Digital Roadmap**  
Prepared for internal planning · August 2026
