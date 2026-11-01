---
phase: 4
title: "Split rounding drift"
status: completed
priority: P2
effort: "45m"
dependencies: []
---

# Phase 4: Split rounding drift

## Goal
Make the member splits from a scanned receipt always sum exactly to the bill total.

## Cause
`getMemberItemsTotal` in `src/stores/paintStore.ts` computes `price * qty / assignees.length` for each member and rounds the total to cents. When an item does not divide evenly, the leftover cent is lost: $10 split 3 ways gives 3.33 + 3.33 + 3.33 = 9.99. `ScanPaint.handleFinalConfirm` saves `totalAmount = getBillTotal()` (10.00) with splits that add up to 9.99. `expenseStore` balances credit the payer with `totalAmount` and debit each member's `calculatedAmount`, so the group's balances no longer sum to zero.

Fees are already fine, because `distributeProportionally` hands the rounding remainder to the largest share.

## Files to Modify
- `src/stores/paintStore.ts`

## Tasks & Steps
1. Split each item among its assignees with the existing `distributeProportionally` helper, using equal weights so the remainder goes to the first assignee deterministically. Accumulate per-member totals in cents (integers) to avoid float drift.
2. Change `getMemberItemsTotal` to use that per-item distribution. `getMemberBreakdown` keeps its current signature.
3. Do not change `getUnassignedTotal`, `getItemsSubtotal` or `getBillTotal`.

## Verification
- A node script runs the store with 3 members and a $10.00 item, a $7.01 item split 2 ways, and tax, tip and discount. It asserts that the sum of `getMemberBreakdown(m).grandTotal` equals `getBillTotal()` exactly, and that no member's share changes by more than $0.01 compared with before.
- `tsc` and `vite build` pass.
