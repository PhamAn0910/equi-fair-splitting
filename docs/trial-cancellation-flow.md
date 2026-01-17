# Trial Cancellation Flow

This document explains how the 3-day free trial cancellation is handled seamlessly.

## Overview

Users who subscribe to the Pro plan get a 3-day free trial. If they cancel during this trial period, they maintain Pro access until the trial ends, and are then automatically downgraded to the free plan **without being charged**.

## How It Works

### Architecture

The system uses a webhook-driven architecture:
- **Lemon Squeezy**: Acts as the "Clock" - tracks subscription lifecycle and sends webhooks
- **Your Backend**: Acts as the "Gatekeeper" - listens to webhooks and updates user access

### Event Flow

#### Scenario: User Cancels on Day 1 of Trial

**Day 1: User Clicks "Cancel Subscription"**
```
1. User cancels in Lemon Squeezy customer portal
2. Lemon Squeezy sends: subscription_cancelled webhook
3. Backend receives webhook:
   - Status: still "active" or "on_trial"
   - cancelled_at: set to current timestamp
   - trial_ends_at: still Day 3
4. Backend action: Mark as cancelled but DON'T downgrade yet
5. User experience: Still has full Pro access (50 scans/day)
```

**Day 3: Trial Period Ends**
```
1. Trial period expires
2. Lemon Squeezy sends: subscription_expired webhook
3. Backend receives webhook:
   - Validates ends_at date is in the past
   - Downgrades plan_type from 'pro' to 'free'
   - Sets status to 'expired'
   - Clears trial_ends_at and current_period_end
4. User experience: Now on free plan (2 scans lifetime)
```

## Webhook Events

### `subscription_created`
**When:** User starts Pro subscription with trial
**Action:** 
- Grant Pro access
- Set status to 'active'
- Record trial_ends_at timestamp

### `subscription_updated`
**When:** Subscription details change
**Action:** 
- Update subscription metadata
- Keep current plan active
- Update trial_ends_at if changed

### `subscription_cancelled`
**When:** User cancels subscription
**Action:**
- Mark status as 'cancelled'
- Record cancelled_at timestamp
- **Keep Pro access** until trial/period ends

### `subscription_expired`
**When:** Trial ends without payment OR paid period ends after cancellation
**Action:**
- **Validate:** Check ends_at is in the past
- **Downgrade:** Change plan_type to 'free'
- Set status to 'expired'
- Clear trial_ends_at and current_period_end

### `subscription_payment_failed`
**When:** Payment fails (trial ending or renewal)
**Action:**
- Mark status as 'past_due'
- Wait for subscription_expired event to downgrade

## Database Schema

### `user_subscriptions` Table

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | string | Clerk user ID |
| `lemonsqueezy_subscription_id` | string | LS subscription ID |
| `plan_type` | enum | 'free' or 'pro' |
| `status` | string | 'active', 'cancelled', 'expired', 'past_due' |
| `current_period_end` | timestamptz | When current billing period ends |
| `trial_ends_at` | timestamptz | When free trial ends (NULL if not on trial) |
| `cancelled_at` | timestamptz | When user cancelled (NULL if active) |

## Key Implementation Details

### Date Validation
```typescript
const endsAt = subscription.ends_at ? new Date(subscription.ends_at) : new Date();
const now = new Date();

if (endsAt <= now) {
  // Safe to downgrade
}
```

### Status Transitions
```
Subscription Lifecycle:
active → cancelled → expired → (downgrade to free)
  ↓
on_trial → cancelled → expired → (downgrade to free)
  ↓
past_due → expired → (downgrade to free)
```

### Important: Never Downgrade on `subscription_cancelled`
The cancelled event means "user won't be charged next period" but they still have access until the period ends. Always wait for `subscription_expired`.

## User Experience

### During Trial (Days 1-3)
- Full Pro access (50 scans/day)
- Can cancel anytime
- No charges if cancelled

### After Cancellation During Trial
- Pro access continues until Day 3
- Subscription badge shows "Cancelled"
- Clear messaging about when access ends

### After Trial Expires
- Automatic downgrade to free plan
- Access to 2 lifetime scans
- Can re-subscribe anytime

## Testing

### Test Cancellation Flow
1. Create test subscription with Lemon Squeezy test mode
2. Cancel immediately after subscribing
3. Verify:
   - Status shows "cancelled"
   - cancelled_at timestamp is set
   - User still has Pro access
4. Manually trigger `subscription_expired` webhook
5. Verify:
   - plan_type changed to 'free'
   - status changed to 'expired'
   - trial_ends_at cleared

## Monitoring

### Key Metrics to Track
- Cancellation rate during trial
- Time-to-cancel (Day 1, 2, or 3)
- Re-subscription rate after trial expiry

### Logging
All webhook events are logged with:
- Event type
- User ID
- Subscription status
- Timestamps
- Actions taken

## Troubleshooting

### User Shows Pro After Trial Expired
**Check:**
1. Did `subscription_expired` webhook fire?
2. Was ends_at date properly validated?
3. Check webhook logs in Lemon Squeezy dashboard

### User Downgraded Before Trial Ended
**Check:**
1. Did backend downgrade on `subscription_cancelled` instead of waiting for `subscription_expired`?
2. Verify webhook handler logic

### Payment Attempted During Trial After Cancellation
**This shouldn't happen** - Lemon Squeezy prevents this automatically when subscription is cancelled.

## Security

### Webhook Signature Verification
All webhooks are verified using HMAC SHA-256:
```typescript
const hmac = crypto.createHmac('sha256', secret);
const digest = hmac.update(rawBody).digest('hex');
crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
```

### User ID Validation
User ID must be present in webhook payload, extracted from custom_data.

## Support

If users have issues with cancellation:
1. Check Lemon Squeezy customer portal for subscription status
2. Verify webhook delivery in LS dashboard
3. Check backend logs for webhook processing
4. Manually verify user_subscriptions table in Supabase
