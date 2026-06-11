# AlAridi Sweets — Spec Compliance Gap Report

**Project:** AlAridi Sweets e-commerce website (Next.js 16 / React 19 / Prisma / Tailwind v4)
**Audited against:** `Alaridi sweets website.pdf` — owner specification
**Date:** 2026-05-17
**Auditor:** Engineering review

---

## TL;DR

The current build is a polished **MVP frontend** with a strong storefront UI, clean i18n (EN/AR + RTL), a functional menu/cart/checkout flow, and an admin panel for products, menu, orders, promos, banners and content. However, when measured against the full spec, large portions of the **commerce backend are stubs or missing**:

- **Customer accounts, loyalty points, gift cards, rewards, wishlist** all live in browser localStorage — no database persistence, no server logic.
- **Promo codes, gift cards, and reward points** have input fields on the checkout but are never validated, looked up, or applied to the total.
- **Payment integration (KNET / cards / Apple Pay) is a placeholder** — `lib/payment.ts` returns success without calling any gateway.
- **Five spec pages are missing entirely:** Product detail page, Promotions, Order Tracking, About Us, Contact.
- **No analytics, no email/SMS, no abandoned-cart recovery, no push notifications, no inventory tracking.**

The good news: design system, i18n, navigation, admin authentication, menu data layer, and the order-create pipeline are all in good shape and can carry the rest.

Below is a section-by-section breakdown matching the order in the PDF.

---

## Legend

- ✅ **Implemented** — present and works end-to-end
- 🟡 **Partial** — UI exists but logic/data is stubbed or disconnected
- ❌ **Missing** — not in the codebase

---

## §2 — Website Structure (Pages & Features)

### Home Page — `app/page.tsx` + `components/home/home-sections.tsx`

| Spec requirement | Status | Notes / File reference |
|---|---|---|
| Hero banner (featured sweets / offers) | ✅ | `components/home/home-hero.tsx` |
| Categories | ✅ | `components/home/home-category-rail.tsx` |
| Bestsellers carousel | ✅ | `home-sections.tsx:84–101` |
| New arrivals | ✅ | `home-sections.tsx:113–131` |
| Promotions / discount banners | ✅ | `home-offer-banners.tsx`, `home-offers-grid.tsx` (DB-backed) |
| Loyalty program highlight | ✅ | `home-sections.tsx:242–262` |
| Testimonials / reviews | 🟡 | Hardcoded copy from dictionary; not a real Review model, no DB |
| Instagram / social feed | 🟡 | Static hashtag cards with placeholder text; no Instagram embed/API |
| Newsletter signup | 🟡 | Input + button rendered, **button has no `onClick`/action** — `home-sections.tsx:322–334` |

**Action items:** Hook up newsletter to a `subscribe` action + email provider. Replace Instagram placeholder with an embed (or remove). Optionally add a Review model so testimonials become real.

---

### Shop / Product Listing — `app/menu/page.tsx`

There is no separate `/shop` route; `/menu` serves this purpose.

| Spec requirement | Status | Notes |
|---|---|---|
| Category filters (type, price, dietary) | ✅ | `menu-full-page.tsx:146–170` — price slider 1–50 KWD, dietary (sugar-free, vegan, gluten-free) |
| Sorting (price, popularity, newest) | ✅ | `menu-full-page.tsx:172–191` |
| Quick add to cart | ✅ | `menu-product-card.tsx:155–179` |
| Product badges (New, Bestseller, Sale) | ✅ | `menu-product-card.tsx:95–129` |

**Action items:** None — this page meets the spec.

---

### Product Detail Page — ❌ NO DEDICATED ROUTE

There is no `app/product/[id]/page.tsx`. Product details are shown via a **dialog/modal** (`components/product/product-detail-dialog.tsx`), which is not the same thing and hurts SEO and shareability.

| Spec requirement | Status | Notes |
|---|---|---|
| Dedicated product detail page | ❌ | Only a dialog exists |
| High-quality images (zoom + gallery) | 🟡 | Zoom-on-hover works, but the "gallery" is the same image duplicated 3 times — `product-detail-dialog.tsx:72`. Prisma `Product` has only a single `image` field. |
| Product description (EN/AR) | ✅ | i18n-backed |
| Ingredients & allergen info | 🟡 | Hardcoded placeholder text; no `ingredients` / `allergens` fields in schema |
| Variants (size, flavor, packaging) | ✅ | Stored in `OrderItem.note` (no `ProductVariant` model — variants aren't priced individually) |
| Price + discount display | ✅ | Uses `oldPrice` field |
| Stock status | 🟡 | Only `isAvailable: Boolean` — no quantity tracking |
| Add to cart / Buy now | ✅ | Both buttons present |
| Related products | ❌ | Placeholder text only |
| Reviews & ratings | ❌ | Placeholder text only, no `Review` model |
| "Earn X points with this purchase" | ✅ | Calculation at `product-detail-dialog.tsx:67–71` |

**Action items (priority):**
1. Create `app/product/[slug]/page.tsx` (real route, real metadata, real OG image).
2. Add `images String[]`, `ingredients String?`, `allergens String[]`, `stockQty Int?` to `Product` schema.
3. Add `Review` model + UI.
4. Implement "related products" query (same category, exclude current).

---

### Gift & Bundles — `app/gifts/page.tsx`

| Spec requirement | Status | Notes |
|---|---|---|
| Pre-made gift boxes | 🟡 | 3 cards rendered from dictionary; not real products in catalog, no Add to Cart |
| Custom bundle builder | 🟡 | UI for base / packaging / card selection, but **selections are not persisted and don't add to cart** |
| Occasion filters (Eid, Ramadan, Birthdays, Weddings) | 🟡 | Static badges — they don't filter anything |

**Action items:** Wire the builder to the cart store (each combination produces a cart line). Make occasion badges actually filter the gift-box catalog. Promote selected products from the catalog to the gift boxes (or seed them).

---

### Cart Page — `app/cart/page.tsx` + `store/cart-store.ts` + `lib/cart-totals.ts`

| Spec requirement | Status | Notes |
|---|---|---|
| Product summary | ✅ | |
| Quantity adjustment | ✅ | |
| Promo code input | 🟡 | Field exists, **no validation or application** |
| Estimated delivery cost | ✅ | `getDeliveryFee()` in `lib/delivery.ts` |
| Points to be earned | ✅ | Shown as estimated points |
| Suggested add-ons | 🟡 | Label rendered, no actual suggestions |

**Action items:** Add a `validatePromoCode` server action and surface the discount in cart totals. Build a "suggested add-ons" query (e.g., bestsellers under 3 KWD).

---

### Checkout Page — `app/checkout/page.tsx` + `components/checkout/checkout-form.tsx`

| Spec requirement | Status | Notes |
|---|---|---|
| Guest or login | 🟡 | Logged-in vs. guest hint shown; not a true wizard step |
| Delivery details | ✅ | Name, phone, street, building, area, notes, saved addresses picker |
| Delivery time slot selection | ✅ | `lib/checkout-constants.ts` defines 5 slots |
| Payment method (KNET / card / Apple Pay / Google Pay) | 🟡 | **Options visible in UI**, but no real gateway — `lib/payment.ts` returns `{ success: true }` without calling anything |
| Fulfillment type (delivery / same-day / scheduled / pickup) | 🟡 | UI options present but **not persisted to DB** — `Order` schema has no `fulfillmentType` field |
| Apply promo code | 🟡 | Input only, never used by `createOrder` |
| Apply gift card | 🟡 | Input only, never used by `createOrder` |
| Apply reward points | 🟡 | Input only, never used by `createOrder` |

**Critical action items:**
1. Integrate a real Kuwait gateway (MyFatoorah / Tap / KNET) — currently nothing charges the customer.
2. Pass `promoCode`, `giftCardCode`, `rewardPoints`, and `fulfillmentType` to `createOrder()` in `actions/orders.ts`.
3. Add corresponding fields to the `Order` model and the `createOrder` validation.
4. Server-validate each code/redemption before saving the order.

---

### User Account Dashboard — `app/account/page.tsx`

⚠️ **Major architectural gap:** the entire customer profile (`lib/customer-auth/local-store.ts`) lives in **browser localStorage**. There is no `User`/`Customer` model in Prisma. Clearing the browser wipes the account. Two devices = two different accounts. This will not survive production.

| Spec requirement | Status | Notes |
|---|---|---|
| Profile info | 🟡 | UI works, but localStorage-only |
| Order history | 🟡 | Orders are persisted in DB, but the customer-side list is rebuilt manually in `checkout-form.tsx:217–225`; DB and client can diverge |
| Saved addresses | 🟡 | localStorage-only; no `Address` model |
| Loyalty points balance | 🟡 | localStorage; never incremented from real order activity |
| Rewards history | 🟡 | localStorage; never populated by server |
| Saved gift cards | 🟡 | localStorage; no `GiftCard` model in DB |
| Wishlist | 🟡 | localStorage; no UI to add items from product cards |

**Action items (priority):** Add `User`, `Address`, `LoyaltyAccount`, `LoyaltyTransaction`, `GiftCard`, `Wishlist`, `WishlistItem` models to Prisma. Migrate customer auth to a session-based backend (NextAuth / Lucia / Clerk). Re-point the dashboard to DB queries.

---

### Loyalty Program Page — `app/loyalty/page.tsx`

| Spec requirement | Status | Notes |
|---|---|---|
| How to earn points | ✅ | Static content, EN/AR |
| How to redeem | ✅ | Static content |
| Tier system explanation | ✅ | Silver / Gold / Platinum cards |

Informational content is fine; the underlying program logic is missing (see §3 below).

---

### Promotions Page — ❌ MISSING (public)

No `app/promotions/page.tsx`. Only the admin `/admin/promos` route exists. Spec calls for a public promotions page with: active offers, coupon campaigns, seasonal deals.

**Action items:** Create `app/promotions/page.tsx` that lists currently-active `PromoCode` rows + `OfferBanner` rows.

---

### Order Tracking Page — ❌ MISSING

Only `app/checkout/confirmation/page.tsx` exists (one-time confirmation). Spec requires a tracking page with real-time status and delivery tracking.

**Action items:** Create `app/orders/[id]/page.tsx`. Use the existing `OrderStatus` enum (`PENDING → PAID → PREPARING → OUT_FOR_DELIVERY → DELIVERED`). Optionally add WebSocket or polling. Optionally integrate a courier API for real-time delivery tracking.

---

### About Us Page — ❌ MISSING

No `app/about/page.tsx`. Spec requires brand story, mission, ingredients sourcing, quality assurance.

**Action items:** Create the page. Content should be CMS-editable via the existing `SiteContent` model.

---

### Contact Page — ❌ MISSING

No `app/contact/page.tsx`. WhatsApp link exists in `components/FloatingSocials.tsx` (regular URL, not Business API). Footer has phone numbers.

| Spec requirement | Status | Notes |
|---|---|---|
| Contact form | ❌ | |
| WhatsApp integration | 🟡 | Link only — not a Business API conversation |
| Location map | ❌ | |

**Action items:** Create the page with a contact form (writing to a `ContactSubmission` model or emailing the team), an embedded map (Google Maps iframe to the Salmiya and Jahra branches), and the WhatsApp link.

---

### Policies Pages — ✅ exist as stubs

`app/privacy-policy/page.tsx`, `app/refund-policy/page.tsx`, `app/terms-and-conditions/page.tsx` all exist but use placeholder dictionary text. Replace with real legal copy before launch.

---

### Blog — 🟡 stub only

`app/blog/page.tsx` lists 3 placeholder posts, all linking to `#`. There's no `BlogPost` model, no individual post route, no CMS.

**Action items:** Add `BlogPost` model (title EN/AR, slug, body, image, publishedAt), `app/blog/[slug]/page.tsx`, and admin CRUD.

---

## §3 — Loyalty Program System

❌ **The entire loyalty program is non-functional.** All spec items are missing:

- **Earn X points per 1 KWD spent** — no logic in `actions/orders.ts`; no `LoyaltyTransaction` model.
- **Bonus: first order, birthday, referrals, special campaigns** — none.
- **Redemption: 100 pts = 1 KWD** — checkout input exists but is never read or applied.
- **Minimum redemption threshold** — not enforced anywhere.
- **Tier system (Silver / Gold / Platinum)** — only described on the marketing page; no tier calculation, no tier benefits applied.

**Action items (priority — this is a big chunk of work):**
1. New models: `LoyaltyAccount` (userId, balance, tier, lifetimePoints), `LoyaltyTransaction` (accountId, type, points, orderId?, reason, createdAt).
2. In `createOrder()`: compute points earned, debit any redeemed points, insert `LoyaltyTransaction` rows.
3. Tier resolver function based on lifetime points.
4. Birthday cron / referral signup hook / first-order bonus.

---

## §4 — Rewards System

❌ All four reward types (discount vouchers, free products, free delivery, exclusive bundles) and all three triggers (points redemption, milestones, seasonal campaigns) are missing.

`lib/rewards.ts` defines a 16-line static stub rule list with no engine to evaluate or apply it.

**Action items:** Add `Reward` and `RewardRedemption` models, write a rule-evaluator that runs after every `createOrder`, expose rewards in the account dashboard.

---

## §5 — Gift Card System

| Spec requirement | Status | Notes |
|---|---|---|
| Digital gift cards (email delivery) | ❌ | No email integration; no `GiftCard` model |
| Physical gift cards (optional) | ❌ | No fulfillment flow |
| Fixed amounts (5, 10, 20, 50 KWD) | ✅ | `lib/gift-cards.ts:8` |
| Custom value | 🟡 | UI input only; not validated/persisted |
| Unique code generation | ✅ | `generateGiftCardCode()` exists |
| Balance tracking | 🟡 | Pure function only; no DB row to track balance |
| Partial usage allowed | ✅ | `applyGiftCardBalance()` handles it |
| Expiry settings | 🟡 | Type field exists; no validation |
| Purchase UI on the storefront | ❌ | No page to buy a gift card |
| Redemption at checkout | ❌ | Input exists; never validated/applied |

**Action items:** Add `GiftCard` model (code, originalValue, balance, ownerEmail?, expiresAt, createdAt); a "Buy a Gift Card" page; `validateGiftCard` server action; apply at checkout; subtract from balance on order success.

---

## §6 — Promo Code System

The `PromoCode` model exists and the admin can create codes, but the system is **incomplete and not wired to checkout**.

| Spec requirement | Status | Notes |
|---|---|---|
| Type: Percentage | ✅ | `PromoDiscountType.PERCENT` |
| Type: Fixed amount | ✅ | `PromoDiscountType.FIXED` |
| Type: Free shipping | ❌ | Not in schema enum; client-side stub only |
| Type: Buy X get Y | ❌ | Not in schema enum; client-side stub only |
| Expiry dates | ✅ | `startsAt` / `endsAt` |
| Usage limits | ❌ | No `maxUses` / `usedCount` field |
| User-specific or public | ❌ | No `userId` field |
| Minimum order value | ✅ | `minOrderAmount` |
| **Checkout integration** | ❌ | **Input captured but never validated or applied** — `actions/orders.ts` ignores `promoCode` |

**Action items:**
1. Extend `PromoDiscountType` enum: add `FREE_SHIPPING`, `BUY_X_GET_Y`.
2. Add `maxUses Int?`, `usedCount Int @default(0)`, `userId String?` to `PromoCode`.
3. Add `promoCodeId`, `discountAmount`, `pointsRedeemed`, `giftCardCode` to `Order`.
4. Add a `validateAndApplyPromo(code, subtotal, userId?)` server action.
5. Call it from `createOrder` and store the resulting discount on the order.

---

## §7 — Payment & Delivery Integration

### Payments — ❌ All missing in practice

| Spec | Status | Notes |
|---|---|---|
| KNET | ❌ | `lib/payment.ts:14–24` is a stub returning `{ success: true }`; no SDK in `package.json` |
| Credit / debit cards | ❌ | Dropdown option only |
| Apple Pay / Google Pay | ❌ | Dropdown options only |

This is the single biggest blocker for launch. Recommend MyFatoorah or Tap Payments (both Kuwait-focused, both support KNET + cards + Apple Pay + Google Pay in one integration).

### Delivery

| Spec | Status | Notes |
|---|---|---|
| Delivery fee rules by area | ✅ | `lib/delivery.ts` — 8 areas, free over 25 KWD |
| Same-day / scheduled delivery | 🟡 | UI option present but **not stored on `Order`** |
| Pickup option | 🟡 | UI option present but **not stored on `Order`** |
| Delivery time slot selection | ✅ | 5 slots |

**Action items:** Add `fulfillmentType` (DELIVERY / PICKUP / SCHEDULED) and `scheduledDate` fields to `Order` and pass them through `createOrder`.

---

## §8 — Admin Panel

| Spec | Status | Notes |
|---|---|---|
| Product management | ✅ | `app/admin/products/page.tsx` + image upload |
| Inventory tracking | ❌ | Schema has only `isAvailable: Boolean`, no quantity |
| Order management | ✅ | `app/admin/page.tsx` is the orders dashboard (search, filter, status transitions) |
| Customer database | ❌ | `app/admin/users/page.tsx` exists but there's no `Customer` model — currently it's admin users |
| Promo code creation | ✅ | `app/admin/promos/page.tsx` |
| Gift card management | ❌ | No `/admin/gift-cards` page; no model |
| Loyalty program control | ❌ | No `/admin/loyalty` page; no model |
| Reports & analytics | 🟡 | `app/admin/operations/page.tsx` is scaffolded with 6 sections of placeholder text |

**Action items:** Add `stockQty` field + low-stock alerts. Add admin pages for: customers (after building the User model), gift cards, loyalty, and a real analytics dashboard (revenue, top products, orders/day).

---

## §10 — Integrations

| Spec | Status | Notes |
|---|---|---|
| Payment gateways (Kuwait) | ❌ | No SDK in `package.json`; `lib/payment.ts` is a stub |
| SMS notifications | ❌ | No Twilio/Unifonic etc. |
| Email marketing | ❌ | No Resend/SendGrid; `lib/marketing.ts` has templates only |
| WhatsApp API | 🟡 | Click-to-chat link only; no Business API |
| Google Analytics | 🟡 | Env var `NEXT_PUBLIC_GA_ID` defined; no GA4 script in `app/layout.tsx` |
| Meta Pixel | 🟡 | Env var `NEXT_PUBLIC_META_PIXEL_ID` defined; no script |

**Action items:** Add Resend (transactional + marketing email), Twilio or Unifonic (SMS order updates), Meta Pixel + GA4 script tags in the root layout, and a WhatsApp Business API webhook if owner wants two-way chat.

---

## §11 — Design Requirements

| Spec | Status | Notes |
|---|---|---|
| Clean premium dessert aesthetic | ✅ | |
| Mobile-first | ✅ | Responsive Tailwind throughout |
| Fast loading | ✅ | Next.js 16 + image optimization on Unsplash domain |
| Arabic + English (RTL) | ✅ | Full i18n provider, cookie-based locale, `dir="rtl"` on `<html>`, font fallback in `globals.css` |

This section is in good shape.

---

## §12 — SEO & Marketing

| Spec | Status | Notes |
|---|---|---|
| SEO-friendly URLs | ✅ | App router |
| Meta tags control | ✅ | `metadata` exports in root + per-page |
| Blog section | 🟡 | Stub only — no `BlogPost` model, no `[slug]` route |
| Abandoned cart recovery emails | ❌ | Template stub in `lib/marketing.ts`; no cron, no sender |
| Push notifications | ❌ | Template stub only; no service worker; no web-push setup |

---

## §13 — Security & Performance

| Spec | Status | Notes |
|---|---|---|
| SSL certificate | (deployment) | `actions/admin-auth.ts:24` sets `secure: true` in production |
| Secure payment processing | ❌ | No payment integration exists |
| Data protection compliance | 🟡 | httpOnly cookies for admin; no cookie-consent banner; no GDPR data-export endpoint |
| CDN for GCC | (deployment) | Not configured in `next.config.ts` — recommend Vercel Edge or Cloudflare |

Also worth flagging: `lib/admin-config.ts` has **hardcoded default admin credentials** (`admin@123.com` / `admin123`). Set these via `.env` only in production.

---

## Cross-Cutting Connections That Are Broken

These are the "doesn't connect right" findings the owner asked about:

1. **Checkout form ↔ `createOrder` action** — the form captures `promoCode`, `giftCardCode`, `rewardPoints`, and `fulfillmentType`, but **none of these reach the server action.** They're collected in state and dropped.
2. **Customer profile ↔ database** — every customer-side feature (loyalty, addresses, wishlist, gift cards, rewards) lives in localStorage. The DB has no `User` row tied to an `Order.customerUserId`.
3. **Order completion ↔ loyalty earning** — even when an order is successfully saved, no points are awarded anywhere.
4. **Newsletter form ↔ anything** — input + button with no handler.
5. **Promo banners ↔ promotions page** — banners are managed in admin but there's no public `/promotions` page to display them outside the home hero.
6. **Gift builder ↔ cart** — selections in the builder UI are not converted into cart lines.
7. **Payment dropdown ↔ payment provider** — selecting KNET does nothing; the order is just saved.
8. **GA / Meta Pixel env vars ↔ analytics scripts** — env vars are read but no script tags are ever rendered.

---

## Recommended Order of Work

Roughly highest-impact-to-lowest, taking dependencies into account.

**Phase 1 — Foundations (data model + auth)**
1. Add `User`, `Address`, `LoyaltyAccount`, `LoyaltyTransaction`, `GiftCard`, `Reward`, `RewardRedemption`, `Wishlist`, `WishlistItem`, `Review`, `BlogPost`, `ContactSubmission` models to Prisma + run `prisma migrate`.
2. Replace localStorage customer auth with NextAuth / Lucia (DB-backed).
3. Migrate the account dashboard to read from DB.

**Phase 2 — Commerce wiring**
4. Extend `PromoCode` (`maxUses`, `usedCount`, `userId`, enum: `FREE_SHIPPING`, `BUY_X_GET_Y`).
5. Extend `Order` (`promoCodeId`, `discountAmount`, `pointsRedeemed`, `giftCardCode`, `fulfillmentType`, `scheduledDate`, `paymentMethod`, `paymentRef`).
6. Wire promo / gift card / reward points + fulfillment type through `createOrder`.
7. Award loyalty points on order completion.

**Phase 3 — Payments + notifications**
8. Integrate MyFatoorah or Tap Payments (KNET + cards + Apple Pay + Google Pay in one).
9. Add Resend (or similar) for order-confirmation + abandoned-cart emails.
10. Add SMS provider for order status updates.

**Phase 4 — Missing pages**
11. Dedicated Product Detail route (`app/product/[slug]/page.tsx`).
12. Public Promotions page.
13. Order Tracking page (`app/orders/[id]/page.tsx`).
14. About Us page.
15. Contact page (form + map + WhatsApp).
16. Real blog (`app/blog/[slug]/page.tsx`) + admin CRUD.

**Phase 5 — Marketing + polish**
17. GA4 + Meta Pixel script tags + key event tracking.
18. Newsletter signup wired to email provider.
19. Gift card purchase page + redemption flow.
20. Reviews + ratings UI.
21. Push notifications (if desired).
22. Replace policy stub copy with real legal text.

**Phase 6 — Admin**
23. `/admin/customers`, `/admin/gift-cards`, `/admin/loyalty`, `/admin/reports`.
24. Inventory quantity tracking + low-stock alerts.

---

## What's Already Solid (Keep As Is)

- Design system, brand aesthetic, typography, mobile-first responsiveness.
- i18n architecture (EN/AR + RTL) — extensible and clean.
- Menu data layer (`lib/menu-data.ts`, DB fallback to seed).
- Cart store (`store/cart-store.ts`).
- Admin authentication + middleware.
- Order creation flow (the part that's wired — `actions/orders.ts`).
- Product + menu CRUD in admin.
- SEO basics (metadata, robots, sitemap).

---

*End of report.*
