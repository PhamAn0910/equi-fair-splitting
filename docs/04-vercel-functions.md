# Phase 4: Vercel Serverless Functions

**Estimated Time:** 2-3 hours

Vercel allows you to run backend code in the same project as your frontend. We will use this for sensitive operations like Lemon Squeezy Webhooks and Admin DB writes.

## 4.1 Create API Directory

Create an `api` folder in your **root** directory (not `src/api`).

```bash
mkdir api
```

## 4.2 Supabase Admin Client

Create `api/_lib/supabase-admin.ts`. The `_` prefix prevents Vercel from turning this into a route.

```typescript
import { createClient } from '@supabase/supabase-js';

// Note: Use process.env for Node.js environment (server-side)
const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase Server Environment Variables');
}

// This client has full admin access - bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
```

## 4.3 Lemon Squeezy Checkout Function

Create `api/lemonsqueezy-checkout.ts`.

```typescript
import { VercelRequest, VercelResponse } from '@vercel/node';
import { lemonSqueezySetup, createCheckout } from '@lemonsqueezy/lemonsqueezy.js';
import { supabaseAdmin } from './_lib/supabase-admin';

const LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY!;
const STORE_ID = process.env.VITE_LEMONSQUEEZY_STORE_ID!;
const APP_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

lemonSqueezySetup({ apiKey: LEMONSQUEEZY_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { variantId, userId, email } = req.body;

  if (!userId || !variantId) {
    return res.status(400).json({ error: 'Missing userId or variantId' });
  }

  try {
    // Create checkout with user metadata
    const checkout = await createCheckout(
      STORE_ID,
      variantId,
      {
        checkoutData: {
          email,
          custom: {
            userId, // Critical: Used for webhook reconciliation
          },
        },
        productOptions: {
          redirectUrl: `${APP_URL}/account?success=true`,
        },
      }
    );

    return res.status(200).json({ 
      checkoutUrl: checkout.data?.data.attributes.url 
    });
  } catch (error: any) {
    console.error('Lemon Squeezy Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
```

## 4.3b Receipt Scan Function (`api/scan-receipt.ts`)

Receipt scanning calls Gemini (falling back to Qwen via OpenRouter) on the server, so the AI keys never reach the browser. The function also owns the AI scan quota:

1. It verifies the caller's Clerk JWT.
2. It reads the effective plan from `user_subscriptions`. An expired, cancelled-past-period-end, or trial-ended Pro plan counts as Free.
3. It calls `consume_scan_quota` with the service-role key. This atomically checks the limit and records the scan (Free: 2 lifetime, Pro: 20 per day; keep in sync with `PLAN_LIMITS` in `src/lib/constants.ts`). Over the limit it returns **403** `{ code: 'SCAN_LIMIT_REACHED' }`, and the client opens the upgrade dialog.
4. If both models fail or no items are found, it calls `refund_scan`, so only successful scans count.

Required env vars: `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_JWT_SECRET`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. The SQL functions come from `supabase/migrations/20261101_server_side_scan_quota.sql`. Run that migration before deploying this function, and run `20261102_revoke_client_scan_rpc.sql` after the deploy.

## 4.4 Install Dependencies for API

Since these run in a Node environment on Vercel:

```bash
npm install -D @vercel/node
```

## 4.5 Development Configuration

To run these functions locally, you should use `vercel dev` instead of just `vite`.

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel dev` (this starts Vite + API functions)

**Note:** If you prefer keeping it simple, you can keep running `npm run dev` for frontend, but API calls to `/api/...` will fail unless you proxy them or use `vercel dev`.

## Checklist

- [ ] `api` folder created
- [ ] `_lib/supabase-admin.ts` created
- [ ] `lemonsqueezy-checkout.ts` created
- [ ] `vercel dev` tested (optional)
