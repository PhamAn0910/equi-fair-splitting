---
phase: 3
title: "Server-side scan quota"
status: completed
priority: P1
effort: "2h"
dependencies: []
---

# Phase 3: Server-side scan quota

## Goal
The server decides and records whether a user may run an AI scan, atomically, and clients can no longer change counts.

## Cause
- `api/scan-receipt.ts` authenticates the caller but never checks `ocr_usage` or the plan. Anyone with a valid Clerk token can call it in a loop and spend the Gemini and OpenRouter budget.
- The only limit is `canScan()` in the browser (`ScanPaint.tsx`). The count is raised afterwards by the client through `increment_scan_count(p_user_id)`. That RPC is `SECURITY DEFINER`, executable by `authenticated`, and trusts the `p_user_id` argument, so a user can raise someone else's count.

## Design
- Limits: Free gets 2 lifetime scans and Pro gets 20 per day (from `PLAN_LIMITS` in `src/lib/constants.ts`).
- Add a migration `supabase/migrations/20261101_server_side_scan_quota.sql` with:
  - `consume_scan_quota(p_user_id text, p_limit int, p_lifetime boolean) returns boolean`. It takes `pg_advisory_xact_lock(hashtext(p_user_id))`, sums usage (all rows for lifetime, today's row for daily), returns false at or over the limit, and otherwise upserts today's row with +1 and returns true. It is `SECURITY DEFINER` with `set search_path = public`.
  - `refund_scan(p_user_id text)`, which decrements today's row with a floor of 0.
  - `REVOKE EXECUTE ... FROM public, anon, authenticated` on `increment_scan_count`, `consume_scan_quota` and `refund_scan`, and `GRANT EXECUTE ... TO service_role` on the two new functions.
- In `api/scan-receipt.ts`, after auth and before calling the AI:
  1. Create a service-role client from `SUPABASE_SERVICE_KEY`, the same way the webhook does.
  2. Work out the effective plan from `user_subscriptions` with the same rules as `subscriptionStore.fetchSubscription`: Pro becomes Free when status is `expired`, when it is `cancelled` and past `current_period_end`, or when it is `on_trial` and past `trial_ends_at`.
  3. Call `consume_scan_quota`. If it returns false, respond **403** with `{ error, code: 'SCAN_LIMIT_REACHED' }` without calling the AI.
  4. If both models fail or return zero items, call `refund_scan` so only successful scans count, which matches today's behavior.
- Client:
  - Remove the `incrementScan` call from `ScanPaint.handleFileSelect` and keep the count refresh after the scan.
  - Delete `incrementScan` from `subscriptionStore`.
  - In `useReceiptOCR`, recognize a 403 `SCAN_LIMIT_REACHED` response so `ScanPaint` can open `UpgradeDialog` instead of showing a generic error toast.
  - Keep `canScan()` as a UX pre-check only.

## Extension trace
The next variant is a new plan tier, such as a "team" plan. The stable contract is `consume_scan_quota(user, limit, lifetime)`, and only the API's plan-to-limit map would change. No registry is needed.

## Files to Create / Modify
- Create: `supabase/migrations/20261101_server_side_scan_quota.sql`
- Modify: `api/scan-receipt.ts`, `src/hooks/useReceiptOCR.ts`, `src/pages/ScanPaint.tsx`, `src/stores/subscriptionStore.ts`
- Docs: update the functions section of `docs/03-supabase-setup.md`, and add `SUPABASE_SERVICE_KEY` for the scan function to `docs/04-vercel-functions.md` if it is not already listed.

## Deploy order (important)
1. The user runs the migration in the Supabase SQL editor. Old clients that still call `increment_scan_count` will get a permission error, which is only logged and harmless.
2. Deploy the code. Deploying the code first would make every scan fail with 500, because `consume_scan_quota` would not exist yet.

## Risks
- If the Supabase project does not contain `increment_scan_count`, the REVOKE fails. Use `DO $$ ... IF EXISTS` guards.
- `current_date` is in the database timezone (UTC), while the client's `getTodayScans` uses a UTC ISO date, so the two agree.

## Rollback
Revert the code commit and run `GRANT EXECUTE ON FUNCTION increment_scan_count(text) TO authenticated;`.

## Verification
- `tsc` and `vite build` pass.
- Review the SQL by reading it. It cannot be run against the production database from here.
- A local harness with a stubbed Supabase client confirms these handler paths: over the limit returns 403 and the AI is never called; under the limit means the AI is called once; when the AI fails, the scan is refunded.
