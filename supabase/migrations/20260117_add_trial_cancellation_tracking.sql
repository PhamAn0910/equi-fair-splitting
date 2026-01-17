-- Add trial_ends_at and cancelled_at columns to track trial and cancellation status
-- This enables proper handling of subscription cancellations during the 3-day trial period

-- Add new columns
ALTER TABLE user_subscriptions 
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add index for faster queries on cancelled subscriptions
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_cancelled 
ON user_subscriptions(cancelled_at) 
WHERE cancelled_at IS NOT NULL;

-- Add index for trial expiration queries
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_trial 
ON user_subscriptions(trial_ends_at) 
WHERE trial_ends_at IS NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN user_subscriptions.trial_ends_at IS 'Timestamp when the free trial period ends. NULL if not on trial.';
COMMENT ON COLUMN user_subscriptions.cancelled_at IS 'Timestamp when the user cancelled their subscription. NULL if active.';
