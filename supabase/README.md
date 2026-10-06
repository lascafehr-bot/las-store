# LASCORE — Phase 1 setup (new Las Café Supabase project only)

Do not reuse another app's Supabase project.

1. Create a new Supabase project for this store.
2. Copy `.env.example` to `.env.local`.
3. Paste **Project URL** into `NEXT_PUBLIC_SUPABASE_URL`.
4. Paste the **anon / publishable** key into `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
   Never put the service-role key in this file or in any `NEXT_PUBLIC_` variable.
5. Authentication → Providers → Email: enable Email.
6. Authentication → Providers → Email: **disable sign-ups** (invite/create users in the dashboard only).
7. Authentication → URL configuration:
   - Site URL: `http://localhost:3000` (later `https://shop.lascafe.sa`)
   - Redirect URLs: `http://localhost:3000/lascore/reset-password` and `https://shop.lascafe.sa/lascore/reset-password`
8. SQL Editor: run `supabase/migrations/20261001_lascore_phase1.sql`.
9. Authentication → Users → Add user (email + password) for the first admin.
10. SQL Editor, then set that person as admin:

```sql
update public.profiles
set role = 'admin', is_active = true, full_name = 'Admin'
where email = 'YOUR_ADMIN_EMAIL';
```

11. Optional second account: Add user, then:

```sql
update public.profiles
set role = 'user', is_active = true, full_name = 'Staff'
where email = 'YOUR_USER_EMAIL';
```

Restart `npm run dev` after saving `.env.local`.
Open `http://localhost:3000/lascore` (not linked from the shop).
