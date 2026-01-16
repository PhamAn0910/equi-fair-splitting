# Lemon Squeezy Integration Spec

## 1. Technical Constraints & Stack
- **SDK:** Use `@lemonsqueezy/lemonsqueezy.js` (Node.js) and `lemon.js` (Frontend).
- **Format:** Strict JSON:API compliance.
  - Headers: `Accept: application/vnd.api+json`, `Content-Type: application/vnd.api+json`
- **Auth:** Bearer Token via `LEMONSQUEEZY_API_KEY`.
- **Environment:**
  - Test Mode: Sandbox API Key + Sandbox Store ID.
  - Live Mode: Production API Key + Production Store ID.

## 2. Backend Implementation (Node.js/Next.js)
**Action:** Replace Stripe Node library.

**Setup:**
- Install: `npm install @lemonsqueezy/lemonsqueezy.js`
- File: `lib/lemonsqueezy.ts` (or equivalent)
- Initialize `lemonSqueezySetup` with `process.env.LEMONSQUEEZY_API_KEY`.

**Checkout Logic:**
- Function: `createCheckout(storeId, variantId, user)`
- **CRITICAL:** Pass user ID in `checkout_data.custom`:
  ```javascript
  checkout_data: {
    email: user.email,
    custom: { userId: user.id } // Essential for webhook reconciliation
  }
Variant Mapping:

Plan A (Monthly): variant_12345 (Replace with actual ID)

Plan B (Yearly): variant_67890 (Replace with actual ID)

## 3. Webhook Handler
Endpoint: /api/webhooks/lemonsqueezy Security:

Validate X-Signature header using HMAC-SHA256 and LEMONSQUEEZY_WEBHOOK_SECRET.

Important: Digest must be computed from the RAW request body (Buffer), not the parsed JSON.

Event Handlers:

order_created -> Provision access, map meta.custom.userId to DB.

subscription_cancelled -> Set status = 'cancelled', keep access until ends_at.

subscription_payment_failed -> Trigger dunning email.

## 4. Frontend (React/Next.js)
Script:

Use next/script with strategy="afterInteractive".

Src: https://app.lemonsqueezy.com/js/lemon.js

Trigger:

Do not use <a> tags.

Use LemonSqueezy.Url.Open(checkoutUrl) to open the overlay.

Ensure window.createLemonSqueezy() is called on route changes if necessary (SPA behavior).