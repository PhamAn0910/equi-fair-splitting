---
phase: 2
title: "Pricing buttons"
status: completed
priority: P2
effort: "30m"
dependencies: []
---

# Phase 2: Pricing buttons

## Goal
Make the landing page's "Get Started" and "Go Pro" buttons work.

## Cause
In `src/components/landing/PricingSection.tsx`, both `<Button>` elements have no `onClick` and no link wrapper. The navbar's "Open App" already links to `/app`, and the upgrade flow lives in `UpgradeDialog`, which `src/pages/Account.tsx` opens.

## Files to Modify
- `src/components/landing/PricingSection.tsx`
- `src/pages/Account.tsx`

## Tasks & Steps
1. "Get Started" navigates to `/app`. The `ProtectedRoute` already sends signed-out users to Clerk sign-in.
2. "Go Pro" navigates to `/account?upgrade=1`.
3. In `Account.tsx`, open `UpgradeDialog` on mount when `upgrade=1` is in the query string, then remove the param so a refresh does not reopen it.

## Verification
- `vite build` passes.
- In a local or preview build, clicking "Get Started" goes to `/app`, which redirects to sign-in when signed out.
- "Go Pro" goes to `/account?upgrade=1` and the upgrade dialog opens once the user is signed in.
