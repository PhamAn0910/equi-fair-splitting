---
title: "Fix verified bugs in the live Equi app"
description: "Fix the webhook crash, dead pricing buttons, client-only scan quota, and 1-cent split drift found on equi-billspliter.vercel.app."
status: in-progress
priority: P1
effort: 4h
branch: fix
tags: [api, frontend, database, payments]
blockedBy: []
blocks: []
created: 2026-11-01
---

# Fix verified bugs in the live Equi app

## Overview

On 2026-11-01 I checked the production deployment (`equi-billspliter.vercel.app`, built from `main` at `1cd3387`) and read the source on branch `fix`. Typecheck and build pass. The four bugs below are confirmed against the code, and two of them were reproduced on the live site.

| # | Bug | Evidence | Severity |
|---|-----|----------|----------|
| 1 | The Lemon Squeezy webhook returns 500 instead of 401 when a signature is invalid. | `curl -X POST /api/lemonsqueezy-webhook -H 'x-signature: abc'` returns `FUNCTION_INVOCATION_FAILED` 500. `crypto.timingSafeEqual` throws when the two buffers differ in length. | P2 |
| 2 | The landing page's "Get Started" and "Go Pro" buttons do nothing. | `src/components/landing/PricingSection.tsx` gives neither `<Button>` an `onClick`, and clicking "Go Pro" on the live site did nothing. | P2 |
| 3 | The AI scan quota is only enforced in the browser. | `api/scan-receipt.ts` never reads or writes `ocr_usage`. The count goes up only when the client later calls the `increment_scan_count` RPC, which is `SECURITY DEFINER` and accepts any `p_user_id`. That means any signed-in user can run unlimited paid AI scans and can inflate other users' counters. | P1 |
| 4 | Shared receipt items leave a 1-cent ghost balance. | `paintStore.getMemberItemsTotal` rounds each member's share separately, so a $10 item split 3 ways gives 3.33 × 3 = 9.99. The bill total is still recorded as 10.00, so the payer is credited 0.01 more than everyone else is debited. | P2 |

## Out of scope

- Lint cleanup (33 `no-explicit-any` and similar errors that existed before this work).
- Production uses Clerk **development** keys, which the browser console warns about. This is a Clerk and Vercel dashboard setting, not a code change, so the user has to do it.
- Page `<title>` still says "BillPaint" while the brand is "Equi".

## Phases

| # | Phase | Status | Depends on |
|---|-------|--------|------------|
| 1 | [Webhook signature crash](./phase-01-webhook-signature.md) | Done | — |
| 2 | [Pricing buttons](./phase-02-pricing-buttons.md) | Done | — |
| 3 | [Server-side scan quota](./phase-03-server-scan-quota.md) | Done | — |
| 4 | [Split rounding drift](./phase-04-split-rounding.md) | Done | — |

The phases touch separate files and can be done in any order.

## Success Criteria

- [x] A webhook request with a bad or wrong-length signature returns 401, never 500.
- [x] "Get Started" leads to the app, and "Go Pro" opens the upgrade flow (after sign-in when needed).
- [x] `/api/scan-receipt` rejects scans over the plan limit with 403 before calling any AI provider, and counts each successful scan exactly once on the server.
- [x] Signed-in clients can no longer change scan counts directly.
- [x] For any receipt assignment, the member splits sum exactly to the bill total.
- [x] `tsc --noEmit -p tsconfig.app.json` and `vite build` still pass, and lint has no new errors.

## Manual steps for the user

1. Apply `20261101_server_side_scan_quota.sql` **before** the code from phase 3 is deployed (done on 2026-11-01), and apply `20261102_revoke_client_scan_rpc.sql` **after** that deploy.
2. Confirm that `SUPABASE_SERVICE_KEY` is set for the scan function in Vercel. The webhook already uses it.
