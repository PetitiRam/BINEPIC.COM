# JEDIDA Marketplace — Full Build (Phases 1–8)

A complete marketplace platform: buyers, sellers, delivery partners and an
admin, with shops, eBay-style listings, AI listing assistants, escrow-backed
multi-provider payments (including crypto), admin-controlled platform
settings, ads, and user↔admin chat. Web app is fully implemented; the mobile
app ships as a concrete Expo plan reusing the same API (see `mobile/`).

## Stack
- **Frontend:** Vite + React + React Router
- **Backend:** Node.js + Express + PostgreSQL (`pg`)
- **Auth:** JWT access/refresh tokens, bcrypt password hashing
- **Payments:** Stripe, Flutterwave, DPO, Coinbase Commerce (crypto) adapters

## Project layout
```
backend/    Express API + PostgreSQL schema (4 migration files, run in order)
frontend/   Vite/React SPA — buyer, seller, delivery and admin experiences
mobile/     Expo/React Native build plan reusing the same API
```

## Setup

### 1. Database
```bash
createdb jedida_marketplace
cd backend
cp .env.example .env   # edit PG* values, and provider keys if you have them
npm install
npm run migrate        # runs schema.sql -> schema_phase2.sql -> schema_phase3.sql in order
```

### 2. Backend API
```bash
cd backend
npm run dev             # http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev              # http://localhost:5173
```
The Vite dev server proxies `/api` to `http://localhost:5000`.

## How the whole system fits together

### Accounts & roles
Everyone signs up as a **buyer** (`POST /api/auth/signup`), verifies their
phone, then can request to become a **seller** or **delivery** partner
(`POST /api/upgrade/request`). Both upgrades require paying a 1,000
mobile-money verification fee (`POST /api/upgrade/pay-fee` — credited
straight to the platform wallet) and admin approval
(`POST /api/upgrade/:id/review`, or via the Admin Panel's Approvals tab).
Admin role is never self-granted — only an existing admin can promote
another user (`POST /api/admin/users/:id/make-admin`).

> To bootstrap your very first admin: after creating an account, manually
> run `UPDATE users SET is_admin = TRUE WHERE email = 'you@example.com';`
> in psql. Every admin after that is created from inside the Admin Panel.

### Shops & listings
Approved sellers open a shop (`POST /api/shops`) — generated UUID, unique
slug, and a `share_link`. **`GET /shop/:slug`** (root-level, not `/api`) is
the actual link to share on social media: it serves Open Graph tags so
Facebook/WhatsApp/X render the shop's name, image and product previews in
the shared post, then redirects real visitors into the SPA at `/s/:slug`.

Sellers list products (`POST /api/products`) in an eBay-style form —
category, condition, price, quantity, images, specs, shipping. Every listing
is run through **Nsubuga Joseph** (`services/nsubugaJosephBot.js`), which
tidies the title, drafts a description if left blank, and flags missing
specs, before the listing goes to `pending_review` for admin approval.
**Colline** (`services/collineBot.js`) generates reusable templates
(title/description/specs schema + suggested images) per category that
sellers can reuse across listings.

Both bots are implemented as real, deterministic services today — the
listing flow fully works end-to-end — with a clear seam to swap in an actual
LLM/image-generation API call later (see the comment block at the top of
each file).

### Main Marketplace (buyer side)
`GET /api/products` (filters: `category`, `sort=newest|trending|popular|
high_demand|price_low|price_high`) and `GET /api/products/agriculture` feed
the three Marketplace tabs — **All Products / Shops / Agriculture** — plus
trending/popular/high-demand sorting for the buyer's browsing experience.

### Checkout, escrow & payments
`POST /api/orders` creates an order and opens a charge with the chosen
provider (`services/paymentProviders.js` — Stripe, Flutterwave, DPO,
Coinbase Commerce; each falls back to a sandbox reference if no provider key
is set, so checkout is fully testable without live keys).
`POST /api/orders/:id/confirm-payment` moves the funds into the shared
**escrow wallet** and decrements stock. The order only becomes `completed`
once **buyer, seller, and (if assigned) delivery partner** have each called
`POST /api/orders/:id/confirm-delivery`. Only then can the admin call
`POST /api/orders/:id/release-funds`, which splits the escrowed amount
between the seller's wallet and the platform wallet (platform fee %, set in
Admin → Settings).

### Delivery
Admins assign a delivery partner to a paid order
(`POST /api/orders/:id/assign-delivery`). The Delivery Dashboard shows
assigned orders and a "Chat with Admin" tab — delivery partners (like
sellers and buyers) only ever chat with the admin team, never each other
directly (`/api/chat/*`).

### Admin Panel (tabs, no sidebar)
- **Approvals** — pending role upgrades, shops, product listings, KYC
- **Users** — suspend/reactivate, grant admin
- **Orders & Payouts** — assign delivery, release escrow funds
- **Ads** — upload ads that rotate in every Marketplace page's header
- **Settings** — logo, theme colors, product card orientation (grid/list),
  platform fee %, upgrade verification fee amount
- **Chat** — reply to any buyer/seller/delivery conversation

### Get Started landing page
Shows live featured products pulled from the Marketplace feed and an
animated "meet your AI assistants" banner (CSS-driven, no external 3D
assets required) encouraging signup.

## Trying the whole flow end-to-end
1. Sign up → verify phone → land on `/marketplace` as a buyer.
2. `/seller/upgrade` → request → pay mock fee.
3. Bootstrap yourself (or a second test account) as admin (see note above),
   go to `/admin` → Approvals → approve the upgrade, the shop, and the
   listing once the seller creates them.
4. As the seller (`/seller`): create your shop, copy the share link, list a
   product (try generating a Colline template first).
5. As a buyer: browse `/marketplace`, open the product, check out with any
   payment method (sandbox mode works with no keys), confirm payment.
6. Seller confirms delivery in their Orders tab; buyer confirms in `/orders`;
   if a delivery partner is assigned, they confirm too.
7. Admin → Orders & Payouts → Release funds once the order shows
   `completed`. Seller's wallet balance updates (`/seller` → Wallet tab).

## What's deliberately a clean extension point (not a missing feature)
- **Image storage**: product/shop image fields accept any URL string today;
  plug in S3/Cloudinary upload before going to production.
- **Real LLM/image calls** for Nsubuga Joseph / Colline — swap the function
  bodies in `backend/src/services/`, signatures stay the same.
- **Live payment webhooks**: `confirm-payment` is currently a directly
  callable endpoint so the escrow flow is testable without configuring
  provider webhooks; in production, call it from each provider's webhook
  handler instead of (or in addition to) the client.
- **Mobile app**: full Expo build plan in `mobile/MOBILE_APP_PLAN.md`,
  reusing this exact API.

---

# Phase 4 — PETITI & TAUSI AI Systems, Fraud Detection, Order Tracking, AI Command Center

This phase turns JEDIDA into an AI-operated marketplace without touching any
existing working code — it's purely additive (new tables, new route
namespaces, new pages, one new admin tab, two new header links).

## What was analyzed before building
- Reused `query`/`pool` from `backend/src/config/db.js`, `requireAuth`/
  `requireAdmin` from `backend/src/middleware/auth.js`, and the existing
  controller → routes → server.js wiring pattern.
- Reused frontend `client.js`, `TabBar`, `card-surface`/`status-chip`/
  `product-grid` CSS classes, and the existing page-per-folder structure
  (`pages/<role>/...`) — no new design system, no new HTTP client.
- Migration system already runs every `schema*.sql` file in order
  (`backend/src/config/migrate.js`), so `schema_phase4.sql` needed no changes
  to the migration runner.

## New backend files

**`backend/src/config/schema_phase4.sql`** — `ai_logs`, `ai_alerts`,
`ai_actions`, `fraud_reports`, `system_health`, `login_attempts`,
`platform_pages`, `theme_overrides`, `component_registry` (PETITI's bounded
site-editing surface), `product_scores`, `product_rankings`, `ad_campaigns`,
`recommendation_logs` (TAUSI), `drivers`, `deliveries`, `tracking_events`
(order tracking).

**`backend/ai/petiti/`**
- `petitiService.js` — PETITI's "hands": logging, alerts, actions, and the
  site-editing surface (logo, theme colors, custom CSS, pages, components).
- `petitiSecurityEngine.js` — real heuristic fraud scans (fake accounts, bot/
  multi-account signals, brute force, duplicate/scam listings, seller abuse,
  wallet abuse, suspicious transactions) that write to `fraud_reports`.
- `petitiMarketplaceEngine.js` — marketplace snapshot + generated growth/ops
  recommendations from live aggregate queries.
- `petitiMonitoringEngine.js` — DB health, escrow-ledger integrity check,
  moderation backlog check, all logged to `system_health`.
- `petitiController.js` / `petitiRoutes.js` — wires all of the above to
  `/api/ai/petiti/*` (admin-gated).

**`backend/ai/tausi/`**
- `tausiService.js` — seller performance aggregation.
- `tausiCategoryEngine.js` — keyword-based product categorizer.
- `tausiRecommendationEngine.js` — product scoring (quality/demand/trust),
  per-category ranking, personalized buyer recommendations.
- `tausiAdsEngine.js` — ad campaign lifecycle + performance scoring.
- `tausiController.js` / `tausiRoutes.js` — wires the above to
  `/api/ai/tausi/*` (buyer-facing reads are public; management is
  admin-gated).

**`backend/src/routes/publicPetiti.js`** — the *output* of PETITI's editing
(a published page, current theme/CSS override, active components) must be
publicly readable even though editing is admin-only. Mounted at `/api/site`.

**`backend/src/controllers/deliveryController.js`**,
**`backend/src/routes/deliveryRoutes.js`**,
**`backend/src/services/trackingService.js`** — driver registration,
delivery creation/assignment, the 9-state status flow with validation, and
the timeline of `tracking_events` behind each delivery. Mounted at
`/api/deliveries`.

## New frontend files

**`frontend/src/ai/petiti/`** — `PetitiDashboard`, `AIActivityLogs`,
`SecurityCenter` (run fraud scans, resolve alerts, view fraud reports —
this *is* the Fraud Monitoring Dashboard / Risk Score / Alert system from
the spec), `MarketplaceIntelligence`, `AIRecommendations`, `SiteEditor`
(logo/theme/CSS/pages), tied together by **`PetitiApp.jsx`**.

**`frontend/src/ai/tausi/`** — `TausiDashboard`, `ProductIntelligence`,
`AdvertisementManager`, `MarketplaceAnalytics`, tied together by
**`TausiApp.jsx`**.

**`frontend/src/pages/admin/AICommandCenter.jsx`** — the new
**Admin → AI Command Center** tab: an Overview (PETITI/TAUSI online status,
delivery monitoring, marketplace health) plus embedded `PetitiApp` and
`TausiApp`.

**`frontend/src/pages/DynamicPage.jsx`** — renders whatever PETITI publishes
through the Site Editor at `/p/:slug`.

**`frontend/src/pages/buyer/OrderTracking.jsx`** +
**`frontend/src/components/TrackingTimeline.jsx`** — buyer-facing delivery
tracking with the full 9-status timeline.

**`frontend/src/pages/delivery/DriverDashboard.jsx`** — separate from the
existing `DeliveryDashboard` (which is the delivery-role chat-with-admin
page): this is the driver's working view — register as a driver, see
assigned deliveries, advance status (`assigned_to_driver` →
`out_for_delivery` → `delivered`, or report a failed delivery), view the
timeline.

**`frontend/src/components/PetitiStyleInjector.jsx`** — mounted once at the
app root; fetches PETITI's current custom CSS from `/api/site/theme` and
injects it as a `<style>` tag, so Site Editor changes apply instantly,
site-wide, with no rebuild.

## How "PETITI can add pages / change CSS / change the logo / add
components" actually works
PETITI does **not** get filesystem or source-code write access — an
autonomous agent that can rewrite its own backend is a severe security risk
(it could silently remove its own safety checks). Instead:
- **Pages** → rows in `platform_pages`, rendered by the generic
  `DynamicPage.jsx` at `/p/:slug`. Add/update/remove with zero deploys.
- **CSS** → `theme_overrides.custom_css`, injected by `PetitiStyleInjector`.
- **Logo** → written to both `platform_settings.logo_url` (existing column)
  and `theme_overrides.logo_url`; `MarketplaceHeader` reads the override and
  passes it into `Logo`'s new `overrideUrl` prop.
- **Components** → rows in `component_registry` (type + JSON config +
  placement), ready for a generic renderer to mount wherever `placement`
  says — the registry and CRUD endpoints exist now (`createComponent`,
  `listComponents`, `deleteComponent` in `petitiService.js`); wire a renderer
  into a specific placement (e.g. the marketplace header) the same way the
  CSS injector was wired in, whenever a first concrete component is needed.
- **Anything bigger** (e.g. "rewrite the checkout flow") → PETITI logs a
  `propose_code_change` action and a low-severity alert for a human engineer
  to review in the AI Activity Logs — it never attempts the edit itself.

## Integration steps to run this phase
1. `cd backend && npm run migrate` — picks up `schema_phase4.sql`
   automatically (the migration runner globs every `schema*.sql` file).
2. `npm run dev` (backend) / `npm run dev` (frontend) — same as before,
   nothing new to install (no new npm packages were required).
3. Sign in as an admin → **Admin Panel → 🤖 AI Command Center** to see
   PETITI/TAUSI status, run a fraud scan, recompute product scores/ad
   performance, and try the Site Editor (publish a page, then visit
   `/p/<slug>`; change the logo and refresh the Marketplace to see it
   update).
4. As a buyer with a paid order, visit **My Orders → Track order** to see
   `OrderTracking.jsx` (it will say "no tracking information yet" until an
   admin creates a delivery for that order via `POST /api/deliveries`).
5. As a delivery-role user, `/driver` registers as a driver and shows
   assigned deliveries once the admin assigns one.

## Honest scope notes
- Fraud scans run on-demand from the Security Center today (`POST
  /api/ai/petiti/security/scan`); wiring them to a cron schedule is a
  one-line addition (call `runFullScan()` from a `setInterval`/node-cron job
  in `server.js`) once you're ready for it to run unattended.
- `tausiCategoryEngine.js` and the AI bots from Phase 2
  (`nsubugaJosephBot.js`, `collineBot.js`) are deterministic today by design
  — same reasoning as before: the system is fully usable end-to-end now, and
  swapping in a real LLM call is a contained change to one function body per
  file.
# BINEPIC.COM
