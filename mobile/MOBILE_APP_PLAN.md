# JEDIDA Marketplace — Mobile App

The mobile app is **not a separate backend** — it consumes the exact same
Express API documented in `backend/`. This file is the concrete plan for
building it with **Expo (React Native)**, reusing as much logic as possible
from the web frontend.

## Why Expo
- One codebase → iOS + Android
- Over-the-air updates (no app-store re-review for most changes)
- Easy camera/file access for KYC document upload and product photos

## Suggested structure
```
mobile/
  app.json
  App.tsx
  src/
    api/client.ts        -- same axios instance pattern as web, swap localStorage for AsyncStorage/SecureStore
    navigation/           -- React Navigation: bottom tabs mirroring the web's scrollable tab bars
      BuyerTabs.tsx        (All Products / Shops / Agriculture)
      SellerTabs.tsx       (My Shop / Products / Add Product / Templates / Orders / Wallet / Notifications / Chat)
      DeliveryTabs.tsx     (Assigned Deliveries / Chat)
      AdminTabs.tsx        (Approvals / Users / Orders / Ads / Settings / Chat)
    screens/               -- one screen per web page; same API calls, native components
    components/
      Logo.tsx              -- same SVG, via react-native-svg
      ProductCard.tsx
      TabBar.tsx             -- React Navigation already gives scrollable tabs natively
  package.json
```

## Key reuse points
- **Auth flow**: identical endpoints (`/api/auth/*`). Store tokens in
  `expo-secure-store` instead of `localStorage`.
- **Design tokens**: copy the color palette and type scale from
  `frontend/src/styles/theme.css` into a `theme.ts` constants file so the
  native app visually matches the web app.
- **Push notifications**: register the Expo push token against the user on
  sign-in (`POST /api/auth/me/push-token` — add this endpoint when wiring
  push), and have the backend's notification-creation code (already
  centralized in `notificationsController.js` / inline `INSERT INTO
  notifications`) also fire an Expo push in addition to writing the DB row.
- **Camera**: use `expo-image-picker` for KYC documents and product photos,
  uploading to whatever object storage you put behind `images`/`logo_url`
  fields (S3, Cloudinary, etc. — not yet wired in this delivery; product/shop
  image fields currently accept any URL string).
- **Deep links for shop share links**: configure the app with the
  `https://yourdomain.com/shop/*` and `/s/*` URL patterns so opening a shared
  shop link on a phone with the app installed opens the app directly
  (universal links / app links), falling back to the web preview otherwise.

## Suggested build order
1. Auth screens (sign up, sign in, verify phone, forgot/reset password)
2. Buyer marketplace tabs + product detail + checkout (reuse payment
   provider checkout URLs via `Linking.openURL` for Stripe/Flutterwave/DPO,
   and an in-app webview for Coinbase Commerce's hosted checkout)
3. Seller dashboard tabs
4. Delivery dashboard tabs
5. Admin panel tabs
6. Push notifications + deep links

This keeps the mobile app a thin native shell over the same business logic
already implemented and tested in the backend.
