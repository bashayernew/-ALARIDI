# AlAridi Sweets — Spec Fix Summary

This is the companion to `SPEC_GAP_REPORT.md`. It tells you **what changed**,
**how to bring the database up to date**, and **what is left for the payment
gateway integration** (the only intentionally-deferred piece).

---

## 1. What got fixed

### Data model (Prisma) — `prisma/schema.prisma`

Added new models: `Customer`, `CustomerSession`, `CustomerAddress`,
`LoyaltyTxn`, `GiftCard`, `GiftCardTxn`, `RewardRedemption`, `WishlistItem`,
`Review`, `BlogPost`, `ContactSubmission`, `NewsletterSubscriber`.

Extended existing models:

- **`Product`** — added `slug` (unique), `nameAr`, `descriptionAr`,
  `ingredients`, `ingredientsAr`, `allergens[]`, `images[]`, `isNew`,
  `stockQty`.
- **`Order`** — added `customerEmail`, `scheduledDate`, `fulfillmentType`,
  `paymentMethod`, `paymentRef`, `discountAmount`, `giftCardApplied`,
  `pointsRedeemed`, `pointsEarned`, `promoCodeId`, `giftCardCode`.
- **`PromoCode`** — added `description`, `buyQty`, `getQty`, `maxUses`,
  `usedCount`, `customerId`; the `discountType` enum now includes
  `FREE_SHIPPING` and `BUY_X_GET_Y`.

New enums: `FulfillmentType`, `PaymentMethod`, `LoyaltyTier`,
`LoyaltyTxnType`, `GiftCardTxnType`, `RewardType`, `RewardTrigger`.

### Customer accounts — DB-backed (not localStorage anymore)

- `lib/customer-auth/server.ts` — server-side session helpers
  (`getCurrentCustomer`, `getCurrentCustomerId`, cookie set/clear).
- `lib/customer-auth/server-password.ts` — Node PBKDF2 hash/verify
  (`hashPasswordServer`, `verifyPasswordServer`).
- `actions/customer-auth.ts` — `registerCustomer`, `loginCustomer`,
  `logoutCustomer`, `getMe`, `updateCustomerProfile`,
  `addCustomerAddress`, `deleteCustomerAddress`.
- `components/auth/customer-auth-provider.tsx` — same hook surface
  (`useCustomerAuth()`) but now calls the server actions.
- `lib/customer-auth/local-store.ts` — deleted (now a no-op stub).

Cookie name: **`al_aridi_customer_session`** (httpOnly, secure in prod).

### Commerce systems wired end-to-end

- `lib/loyalty.ts` — earning rate (10 pts / 1 KWD), redemption rate (100 pts
  = 1 KWD), tier resolver (Silver / Gold / Platinum), tier multipliers,
  bonus values (first order, birthday, referral).
- `lib/promotions.ts` — `validatePromoForSubtotal()` with full rule support
  (enabled, start/end window, min order, max uses, customer scope, all four
  discount types).
- `lib/gift-cards.ts` — `validateGiftCardRow()`, `applyGiftCardBalance()`,
  unique code generator.
- `actions/promo-codes.ts` — `validatePromoCode()` server action.
- `actions/gift-cards.ts` — `validateGiftCard()`, `issueGiftCard()`.
- `actions/wishlist.ts` — `addToWishlist`, `toggleWishlist`,
  `removeFromWishlist`, `isInWishlist`.
- `actions/orders.ts` — fully rewritten. Validates promo code, validates
  gift card, redeems loyalty points (snapped to valid multiples), awards
  points based on tier, awards first-order bonus, decrements stock,
  records `LoyaltyTxn` / `GiftCardTxn` rows, increments `PromoCode.usedCount`,
  saves new address if requested, and calls the payment adapter.
- `components/checkout/checkout-form.tsx` — rewritten. Promo / gift card /
  reward points are applied live to the summary, validated server-side
  before submit, and passed through to `createOrder`.

### Missing pages — now created

- **`/product/[slug]`** — real product detail page (server-rendered with
  metadata, OG image, related products, reviews). Replaces the modal-only
  flow.
- **`/promotions`** — public list of active offer banners, promo codes, and
  on-sale products (DB-backed).
- **`/orders/[id]`** — customer-facing tracking page with status timeline,
  delivery details, items, totals, and points earned.
- **`/about`** — full About Us page (story, mission, four pillars).
- **`/contact`** — contact form, phone / WhatsApp / email / map.
- **`/blog`** — DB-backed list, **`/blog/[slug]`** for individual posts.
- **`/gifts/buy`** — buy a digital gift card (fixed amounts or custom).
- Policy pages (`/privacy-policy`, `/refund-policy`,
  `/terms-and-conditions`) — replaced stubs with full sectioned templates
  (EN + AR).

### Disconnections fixed

- **Newsletter** — `components/newsletter-signup.tsx` + `actions/newsletter.ts`.
  Home page newsletter actually subscribes now.
- **Gift bundle builder** — `components/gifts/gift-bundle-builder.tsx`.
  Real catalog products, quantity controls, recipient + card, adds to cart
  with gift wrap.
- **Pre-made gift boxes** — now link to real bestseller products.
- **GA4 + Meta Pixel scripts** — render in `app/layout.tsx` when
  `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_META_PIXEL_ID` are set.
- **Wishlist** — full hook-up on product detail page + remove on account
  dashboard.
- **Payment adapter** — `lib/payment.ts` is now an explicit adapter with a
  `PAYMENT_PROVIDER` env switch and a clear `initiatePayment` signature
  (amount, customer, method, etc.). Drop-in point for your Kuwait gateway.
- **Email adapter** — `lib/email.ts` (`sendEmail`, `sendGiftCardEmail`,
  `sendOrderConfirmationEmail`, `sendContactNotificationEmail`). No-op
  until you set a provider; never blocks order/gift card flow.

### Admin panel additions

New routes: `/admin/gift-cards`, `/admin/loyalty`, `/admin/blog`,
`/admin/reviews`, `/admin/contact`, `/admin/reports`. The customers list
(`/admin/users`) is now DB-backed.

### i18n

All 200+ new keys added to both `EN_DICT` and `AR_DICT` in
`lib/dictionary.ts`. RTL support unchanged.

### Vercel readiness

- `package.json` — `build` script now runs `prisma generate && prisma
  migrate deploy && next build`. So every deploy auto-applies pending
  migrations.
- `next.config.ts` — more image hosts allowed, security headers,
  `poweredByHeader: false`, `reactStrictMode: true`.
- `lib/prisma.ts` — already uses the serverless-safe singleton pattern.
- `.env.example` — exhaustive list of env vars with comments.
- `DEPLOYMENT.md` — step-by-step Vercel + Postgres setup, env vars,
  payment-integration guide, and a health-check list.

---

## 2. What you need to run before the first deploy

```bash
# 1. Install deps (regenerates Prisma client)
npm install

# 2. Point DATABASE_URL at your dev DB and generate the initial migration
npx prisma migrate dev --name init_with_full_spec

# 3. (Optional) Seed sample data
npm run db:seed

# 4. Commit prisma/migrations/* so Vercel can apply them on deploy
git add prisma/migrations
git commit -m "prisma: initial schema with full spec models"
git push
```

On Vercel:
1. Add a Postgres database (Vercel Postgres or Neon).
2. Set env vars (see `.env.example` and `DEPLOYMENT.md`).
3. Push to your Git remote — Vercel will build, deploy, and run
   `prisma migrate deploy` automatically.

> If `migrate dev` complains about existing data without slugs, just run
> `npx prisma migrate reset` in dev (wipes the DB and re-runs seed).

---

## 3. The one thing left: payment gateway

`lib/payment.ts` is now a clean adapter. To wire up your Kuwait provider:

1. Set `PAYMENT_PROVIDER` (e.g. `myfatoorah`, `tap`) in Vercel env vars and
   add the provider's API keys.
2. In `lib/payment.ts → initiatePayment`, add a `case` for your provider:
   - Create a payment session (provider-specific call).
   - Return `{ success: true, gatewayReference: "<id>", redirectUrl: "<...>" }`.
3. Add a webhook route at `app/api/payments/webhook/route.ts` that:
   - Validates the signature using `verifyPaymentWebhook()` (you'll
     implement this — also in `lib/payment.ts`).
   - On `paid`, runs `prisma.order.update({ where: { id: orderId },
     data: { status: "PAID", paymentRef } })`.
4. In `components/checkout/checkout-form.tsx`, after `createOrder` succeeds
   and `res.paymentRedirectUrl` is set, redirect the customer to the
   gateway's hosted page.

That's it — every other commerce flow already records the data the gateway
needs (`Order.paymentMethod`, `Order.paymentRef`, the total in KWD, the
customer email).

---

## 4. Health-check list (after first deploy)

Walk through these to confirm everything is wired:

- `/` — newsletter input subscribes (check `/admin/contact` or the DB).
- `/menu` → click a product → lands on `/product/<slug>` (not a modal).
- `/promotions` — see promo codes + offer banners from DB.
- `/gifts` — builder adds items to cart with gift wrap.
- `/gifts/buy` — issue a 5 KWD gift card; copy the code.
- `/register` → `/login` → place a test order.
- At checkout: apply the gift card code, apply a promo code (e.g. `WELCOME10`
  if you seeded), redeem some points, change fulfillment to PICKUP. Confirm
  the total drops correctly.
- After order is created: `/account` shows the order, new address, new
  loyalty transaction, points balance up by the earned amount.
- `/orders/<id>` — order tracking timeline visible.
- `/admin/reports` — order count + revenue reflect your test order.
- `/admin/loyalty` — see the txn in "Recent transactions".
- `/admin/gift-cards` — gift card balance is `0` (fully redeemed) or
  partially used.
- `/admin/contact` — submitting `/contact` form shows up here.
- `/blog` and `/blog/<slug>` — DB-driven posts render.

If any of these fail, check the browser console + Vercel logs.

---

## 5. Files inventory (new + heavily modified)

### Created

```
actions/customer-auth.ts
actions/promo-codes.ts
actions/gift-cards.ts
actions/wishlist.ts
actions/newsletter.ts
actions/contact.ts
actions/blog-admin.ts
actions/reviews-admin.ts
app/product/[slug]/page.tsx
app/promotions/page.tsx
app/orders/[id]/page.tsx
app/about/page.tsx
app/contact/page.tsx
app/blog/[slug]/page.tsx
app/gifts/buy/page.tsx
app/admin/gift-cards/page.tsx
app/admin/loyalty/page.tsx
app/admin/blog/page.tsx
app/admin/reviews/page.tsx
app/admin/contact/page.tsx
app/admin/reports/page.tsx
components/auth/customer-auth-provider.tsx        (rewritten)
components/product/product-detail.tsx
components/checkout/checkout-form.tsx             (rewritten)
components/contact-form.tsx
components/newsletter-signup.tsx
components/gifts/gift-bundle-builder.tsx
components/gifts/buy-gift-card-form.tsx
components/admin/gift-cards-admin.tsx
components/admin/blog-admin.tsx
components/admin/reviews-admin.tsx
lib/loyalty.ts
lib/email.ts
lib/customer-auth/server.ts
lib/customer-auth/server-password.ts
DEPLOYMENT.md
FIXES_APPLIED.md            (this file)
```

### Heavily modified

```
prisma/schema.prisma                  (huge schema extension)
prisma/seed.ts                        (slugs + promo codes + blog posts)
actions/orders.ts                     (rewritten — discounts, points, gift cards)
actions/products-admin.ts             (slug, ingredients, allergens, stock)
lib/promotions.ts                     (rewritten for DB shape)
lib/gift-cards.ts                     (DB-aware validation)
lib/payment.ts                        (adapter pattern with TODO)
lib/customer-auth/types.ts            (new DB-backed shape)
lib/customer-auth/public.ts           (maps DB → public DTO)
lib/customer-auth/constants.ts        (new cookie name)
lib/customer-auth/local-store.ts      (now a no-op stub)
lib/data.ts                           (added getProductBySlug, getRelatedProducts)
lib/dictionary.ts                     (200+ new keys, EN + AR)
types/index.ts                        (ProductDTO extended)
lib/menu-mapper.ts                    (updated for new ProductDTO)
components/account/account-dashboard.tsx
components/product/product-card.tsx
components/home/home-sections.tsx     (newsletter wired)
components/admin/admin-chrome.tsx     (new nav links)
components/admin/users-admin.tsx      (now DB-backed)
components/auth/login-form.tsx        (new error codes)
components/auth/register-form.tsx     (new error codes)
components/layout/site-header.tsx     (Promotions/About/Contact links)
components/layout/site-footer.tsx     (same)
app/layout.tsx                        (GA / Meta Pixel scripts; hydrate user)
app/providers.tsx                     (accept initial server-fetched user)
app/page.tsx                          (unchanged but downstream wiring updated)
app/gifts/page.tsx                    (DB-backed products + builder)
app/blog/page.tsx                     (DB-backed)
app/admin/users/page.tsx              (now DB-backed)
app/privacy-policy/page.tsx
app/refund-policy/page.tsx
app/terms-and-conditions/page.tsx
next.config.ts                        (image hosts, security headers)
package.json                          (build runs migrate deploy)
.env.example                          (exhaustive)
```

---

Anything missing or any errors at runtime — point me at the file/line and I'll
fix it.
