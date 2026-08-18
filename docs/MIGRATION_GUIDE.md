# Migration Guide: Trial Cancellation Support

## What Changed

Added support for seamless handling of subscription cancellations during the 3-day free trial period.

## Files Modified

### 1. **API/Backend**
- `api/lemonsqueezy-webhook.ts` - Enhanced webhook handlers for all subscription lifecycle events

### 2. **Database Schema**
- `supabase/migrations/20260117_add_trial_cancellation_tracking.sql` - New migration file
- Added columns:
  - `trial_ends_at` (timestamptz)
  - `cancelled_at` (timestamptz)

### 3. **Type Definitions**
- `src/types/database.ts` - Updated Subscription interface
- `src/lib/supabase/types.ts` - Updated database types
- `src/stores/subscriptionStore.ts` - Updated local Subscription interface

## Deployment Steps

### Step 1: Run Database Migration

**Option A: Using Supabase CLI (Recommended)**
```bash
cd /Users/phaman/Downloads/bill-painter
supabase db push
```

**Option B: Using Supabase Dashboard**
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy content from `supabase/migrations/20260117_add_trial_cancellation_tracking.sql`
4. Paste and run the SQL

### Step 2: Verify Migration

Check that new columns exist:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'user_subscriptions' 
  AND column_name IN ('trial_ends_at', 'cancelled_at');
```

Expected result:
```
column_name   | data_type
--------------+--------------------------
trial_ends_at | timestamp with time zone
cancelled_at  | timestamp with time zone
```

### Step 3: Deploy Code Changes

```bash
git add .
git commit -m "feat: add trial cancellation handling"
git push origin main
```

Vercel will automatically deploy the changes.

### Step 4: Test Webhook Flow

1. **Go to Lemon Squeezy Dashboard**
   - Navigate to Settings → Webhooks
   - Find your webhook endpoint
   - Test the following events:
     - `subscription_created`
     - `subscription_cancelled`
     - `subscription_expired`

2. **Verify webhook logs:**
   - Check Vercel function logs for webhook processing
   - Confirm proper logging output for each event

### Step 5: Monitor Production

After deployment, monitor:
- Webhook delivery in Lemon Squeezy dashboard
- Supabase logs for any database errors
- User reports of subscription issues

## Rollback Plan

If issues occur, you can safely rollback:

**Remove new columns (not recommended - data loss):**
```sql
ALTER TABLE user_subscriptions 
DROP COLUMN IF EXISTS trial_ends_at,
DROP COLUMN IF EXISTS cancelled_at;
```

**Better approach:** Keep columns but revert webhook logic in git:
```bash
git revert HEAD
git push origin main
```

## Testing Checklist

- [ ] Database migration runs successfully
- [ ] No TypeScript compilation errors
- [ ] Webhook signature verification still works
- [ ] `subscription_created` properly sets trial_ends_at
- [ ] `subscription_cancelled` marks subscription but maintains access
- [ ] `subscription_expired` properly downgrades to free
- [ ] User experience remains smooth during trial cancellation

## FAQ

**Q: Will existing subscriptions be affected?**
A: No. Existing subscriptions will have NULL values for the new columns, which is handled gracefully.

**Q: What happens to users currently in trial?**
A: Their existing subscriptions continue normally. The new columns will be populated on the next webhook event.

**Q: Do I need to update Lemon Squeezy configuration?**
A: No. Your webhook URL and settings remain the same. The changes are only in your backend code.

**Q: What if a webhook fails?**
A: Lemon Squeezy automatically retries failed webhooks. Check the webhook logs in LS dashboard for retry attempts.

## Support

For issues during deployment:
1. Check Vercel deployment logs
2. Check Supabase logs for SQL errors
3. Verify webhook delivery in Lemon Squeezy
4. Review `/docs/trial-cancellation-flow.md` for implementation details
