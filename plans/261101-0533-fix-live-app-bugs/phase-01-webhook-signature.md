---
phase: 1
title: "Webhook signature crash"
status: completed
priority: P2
effort: "20m"
dependencies: []
---

# Phase 1: Webhook signature crash

## Goal
Make an invalid `X-Signature` return 401 instead of crashing the function with a 500.

## Cause
`verifySignature` in `api/lemonsqueezy-webhook.ts` calls `crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest))`. Node throws `RangeError` when the two buffers differ in length, and the call sits outside the handler's `try`, so Vercel reports `FUNCTION_INVOCATION_FAILED`.

There is a second weakness: `webhookSecret` is read with a non-null assertion. If it is missing, `createHmac` throws as well.

## Files to Modify
- `api/lemonsqueezy-webhook.ts`

## Tasks & Steps
1. In `verifySignature`, compare as hex-decoded buffers and return `false` when the lengths differ, before calling `timingSafeEqual`.
2. In the handler, return 500 "Server configuration error" when `LEMONSQUEEZY_WEBHOOK_SECRET` is unset, instead of crashing inside the HMAC call.
3. Wrap `JSON.parse(rawBody)` so a malformed body returns 400.

## Verification
- A local harness calls the handler with a short signature, a wrong 64-character hex signature, and a correct signature. The first two must return 401 and the third must get past verification.
- After the preview deploy, `curl -X POST <preview>/api/lemonsqueezy-webhook -H 'x-signature: abc' -d '{}'` must return 401.
