# Al Aridi Sweets — Deployment Guide (Vercel + Postgres)

This project is a Next.js 16 app using Prisma + PostgreSQL. It is designed to deploy on **Vercel** with **Vercel Postgres** or **Neon** (both work out of the box).

---

## 1. Provision the database

Pick one:

**Vercel Postgres**
1. In your Vercel project → Storage → Create Database → Postgres.
2. Vercel auto-populates `DATABASE_URL` (plus pooled / unpooled variants).
3. The pooled URL is fine for the app — Prisma works with it.

**Neon**
1. Create a project on neon.tech.
2. Copy the **pooled** connection string into `DATABASE_URL`.
3. Add `?sslmode=require` if not present.

**Supabase**
1. Project → Settings → Database → Connection string (URI).
2. Use the **session pooler** URL (port 6543) for `DATABASE_URL`.

---

## 2. Environment variables (Vercel → Settings → Environment Variables)

Required:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Postgres connection string (see above) |
| `ADMIN_EMAIL` | Login for `/admin` (set a strong value!) |
| `ADMIN_PASSWORD` | Login for `/admin` (set a strong value!) |

Optional but recommended at launch:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | Phone on contact page / floating button |
| `NEXT_PUBLIC_PHONE` | Shown on contact page |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Shown on contact page |
| `NEXT_PUBLIC_MAP_EMBED_URL` | Google Maps embed URL for the contact page |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 measurement ID — script only renders if set |
| `NEXT_PUBLIC_META_PIXEL_ID` | Meta (Facebook) Pixel ID — script only renders if set |
| `CONTACT_NOTIFICATION_EMAIL` | Inbox that receives contact-form submissions (when email is wired) |
| `RESEND_API_KEY` | Required only after you wire `lib/email.ts` to Resend |

Payment provider (leave blank until you have the Kuwait gateway API):

| Variable | Purpose |
|---|---|
| `PAYMENT_PROVIDER` | `myfatoorah`, `tap`, `knet`, … |
| `MYFATOORAH_API_KEY` | (or equivalent for your provider) |
| `MYFATOORAH_BASE_URL` | (or equivalent) |

Until `PAYMENT_PROVIDER` is set, the order flow still works end-to-end but no charge is attempted (orders are saved with status `PENDING`). See `lib/payment.ts` for the adapter you’ll fill in.

---

## 3. First deploy

The `build` script in `package.json` is set to:

```
prisma generate && prisma migrate deploy && next build
```

That means **every Vercel deploy automatically applies pending migrations**. You don’t need any extra steps after pushing.

**First time only:**
1. Commit the migration files in `prisma/migrations/` (see step 4 below).
2. Push to your Git remote — Vercel will build, deploy, and run `prisma migrate deploy` against the database.
3. (Optional) From your local machine, run `npm run db:seed` to seed sample products, promo codes, and blog posts. Run it again any time you want to re-seed (it wipes and re-inserts).

---

## 4. Creating the initial migration (from your machine)

Before the first Vercel deploy:

```bash
# 1. Make sure DATABASE_URL points to your *production* database in .env
# 2. Generate the migration files from the schema
npx prisma migrate dev --name init
# 3. Commit prisma/migrations/* to Git
git add prisma/migrations
git commit -m "prisma: initial migration"
git push
```

If you already have a database with the older schema (without the new
models), use `prisma migrate dev` so Prisma diffs the schema and creates
the right ALTER statements.

---

## 5. Customer auth notes

- Customer accounts now live in the database (`Customer`, `CustomerSession`, `CustomerAddress`, …). The cookie used is `al_aridi_customer_session` (httpOnly, secure in production).
- Admin auth still uses the existing `al_aridi_admin` cookie.
- Both work fine on Vercel serverless — no extra config needed.

## 6. Payment integration when ready

When the Kuwait provider gives you keys:
1. Set `PAYMENT_PROVIDER` and the provider-specific keys in Vercel env vars.
2. Open `lib/payment.ts` and uncomment / fill in the branch for your provider in `initiatePayment`.
3. Implement `verifyPaymentWebhook` and add a route handler (e.g. `app/api/payments/webhook/route.ts`) that calls it and updates the order’s `status` to `PAID` + writes `paymentRef`.
4. Update the checkout flow to follow `payRes.redirectUrl` when present.

## 7. Health checks

After deploy, visit:
- `/` — storefront
- `/menu` — catalog from DB
- `/product/<slug>` — product detail with reviews, related, wishlist
- `/promotions` — public promo codes + offer banners
- `/gifts` — pre-made boxes + custom bundle builder + “Buy a gift card” CTA
- `/gifts/buy` — issue a gift card (test with a small amount)
- `/loyalty` — program info
- `/about` — brand story
- `/contact` — submit a test message → it should appear in `/admin/contact`
- `/register` → `/login` → `/account` — create a customer, place a test order, check loyalty points increase
- `/orders/<id>` — order status timeline
- `/admin` — orders dashboard
- `/admin/reports` — KPIs
- `/admin/loyalty` — program controls + recent transactions
- `/admin/gift-cards` — issue a card
- `/admin/blog` — create/edit a post
- `/admin/reviews` — moderate reviews
- `/admin/users` — customers
- `/admin/contact` — submissions inbox

## 8. Common gotchas

- **Migration error on first deploy.** If `migrate deploy` fails with “no migration found”, run `npx prisma migrate dev --name init` locally first and commit `prisma/migrations/`.
- **`DATABASE_URL` includes `pgbouncer=true` warning.** That’s fine for Prisma client queries; just keep `?pgbouncer=true&connect_timeout=15` (Neon’s pooled URL already does this).
- **Image domain errors.** Add the domain to `next.config.ts` → `images.remotePatterns`.
- **Cookies not set in production.** Make sure your Vercel project URL is HTTPS — the customer & admin cookies are `Secure: true` in production.
