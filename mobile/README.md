# JEDIDA Marketplace — Mobile App (Expo / React Native)

A real, runnable Expo app consuming the exact same backend API as the web
frontend — same endpoints, same auth flow, same business rules. Replaces the
earlier planning doc (`MOBILE_APP_PLAN.md`, kept below for context on what's
intentionally deferred).

## Stack
Expo + React Navigation (native-stack + bottom-tabs) + axios + expo-secure-store.

## Setup
```bash
cd mobile
npm install
```
Edit `app.json` → `expo.extra.apiBaseUrl` to point at your backend (defaults
to `http://localhost:5000/api`, which works in the iOS simulator but **not**
on a physical device or Android emulator — use your machine's LAN IP, e.g.
`http://192.168.1.20:5000/api`, in that case).

```bash
npm start          # then press i / a / w, or scan the QR code in Expo Go
```

## How it's structured
```
App.js                          — wraps everything in AuthProvider + RootNavigator
src/
  api/client.js                 — axios instance, token refresh, mirrors frontend/src/api/client.js
  context/AuthContext.js        — signIn/signUp/signOut/current user, persisted via expo-secure-store
  theme/index.js                 — same color palette as frontend/src/styles/theme.css
  components/                   — Logo, ProductCard, StatusChip, TrackingTimeline, shared UI primitives
  navigation/
    RootNavigator.js             — boot screen → AuthNavigator OR MainStack
    AuthNavigator.js              — sign in/up/forgot/verify-phone
    BuyerTabs.js / SellerTabs.js / DeliveryTabs.js — bottom tabs per role
  screens/
    auth/...                     — SignIn, SignUp, ForgotPassword, VerifyPhone
    buyer/...                    — Marketplace, Shop, ProductDetail, Checkout, MyOrders, OrderTracking
    seller/...                   — ShopSetup, MyProducts, AddProduct, Orders, Wallet, SellerUpgrade
    delivery/...                 — DriverDashboard, DeliveryChat, DeliveryUpgrade
    AccountScreen.js              — profile + upgrade entry points + sign out
```

## How role-based navigation works
`RootNavigator` checks `user.primary_role` and mounts `BuyerTabs`,
`SellerTabs`, or `DeliveryTabs` accordingly — exactly mirroring how the web
app's `MarketplaceHeader` picks which dashboard link to show. Shared
push-screens (`ProductDetail`, `Checkout`, `Shop`, `OrderTracking`, the two
upgrade screens) live in the parent stack so any tab can navigate to them.

## What's intentionally NOT in the mobile app yet
- **Admin Panel / AI Command Center** — these are dense, desktop-oriented
  control surfaces (multi-panel approvals, ad campaign tables, theme/CSS
  editing). Admins should keep using the web app for these; building a
  faithful mobile version of a 6-tab admin console is a separate, large
  effort better scoped on its own.
- **Live image upload** — image fields take a URL today on both web and
  mobile; wire `expo-image-picker` + your object storage of choice when
  ready (same note as the web README).
- **Push notifications** — `notifications` already exist server-side; add
  `expo-notifications`, register the push token against the user on sign-in,
  and have the backend's notification-insert code also fire an Expo push.
  Not wired yet to keep this delivery focused and testable without a push
  certificate setup.
- **Deep links into shared shop/page links** — `app.json` declares the
  `jedida://` scheme and an `https://jedidamarketplace.com` intent filter so
  this is ready to wire up; point your production domain at it and add a
  `Linking` config mapping `/s/:slug` → `Shop` once you have a real domain.

## Testing the flow end-to-end
1. Run the backend (`cd backend && npm run dev`) and make sure `apiBaseUrl`
   in `app.json` points at it.
2. Sign up → verify phone (code prints to the backend console in sandbox
   mode, or arrives by SMS if Twilio is configured) → you land in
   `BuyerTabs`.
3. Account tab → Become a seller → pay the mock fee → have an admin approve
   it from the web Admin Panel → sign out and back in → you're now in
   `SellerTabs`.
4. Browse the Marketplace tab as a different (buyer) account, buy something,
   check out, track it.
