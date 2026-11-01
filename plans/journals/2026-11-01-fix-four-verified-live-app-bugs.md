---
title: Fix four verified live-app bugs
date: 2026-11-01
summary: "Webhook 500 on bad signature, dead pricing buttons, browser-only scan quota, and 1-cent split drift fixed on branch fix; migration not yet applied."
---

# Fix four verified live-app bugs

## What happened
A check of the live app (equi-billspliter.vercel.app) and the source found four bugs:

- `api/lemonsqueezy-webhook.ts`: `crypto.timingSafeEqual` throws on a length mismatch, so any short `X-Signature` crashed the function with a 500 (`FUNCTION_INVOCATION_FAILED`). The handler now returns 401. It also returns 400 on invalid JSON and 500 when the secret is missing.
- `PricingSection.tsx`: "Get Started" and "Go Pro" had no handler. They now link to `/app` and `/account?upgrade=1`, and `Account.tsx` opens `UpgradeDialog` from that query parameter.
- The scan quota was only checked in the browser, and `increment_scan_count` was a SECURITY DEFINER function that accepted any `p_user_id`. The new migration `supabase/migrations/20261101_server_side_scan_quota.sql` adds `consume_scan_quota` (an advisory lock plus check-and-increment) and `refund_scan`, and only `service_role` can execute them. `api/scan-receipt.ts` now enforces the quota before calling the AI, returns a 403 with `SCAN_LIMIT_REACHED` when the limit is hit, and refunds the scan on failure or when no items are found. The client no longer increments the count itself.
- `paintStore.getMemberItemsTotal` rounded each member's share separately, so a $10 item split 3 ways added up to $9.99. It now splits each item with `distributeProportionally`.

## Verification
- Webhook harness: a short signature crashed the old code and returns 401 with the new code.
- Split fuzz test: 972 of 2000 random receipts were off before the fix, and 0 after.
- Scan API harness with a stubbed fetch: all 6 scenarios behave correctly (quota left, over the limit, Pro, expired Pro, both models failing, zero items).
- Throwaway local Postgres 14: the migration runs and can be run again, the client roles lose EXECUTE on the old function, and 30 concurrent scans against a limit of 20 record exactly 20.
- `tsc` and `vite build` pass, and lint stays at 44 problems, the same as before.

## Next steps
- Apply the migration to Supabase before deploying the code.
- Commit, open a PR from `fix` to `main`, and check the preview deployment.
- Switch Clerk from development to production keys (dashboard).

> Historical work record — not durable authority. Prefer docs/specs/ADRs for current decisions.
