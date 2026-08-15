-- Tighten RLS policies on user_subscriptions and ocr_usage
-- 
-- IMPORTANT: This migration MUST ship together with the code change that
-- switches incrementScan() to use the increment_scan_count RPC function.
-- If applied alone, direct client .upsert() calls to ocr_usage will fail.
--
-- After this migration:
--   - user_subscriptions: clients can only SELECT their own row
--     (writes are handled by the lemonsqueezy-webhook via service_role key)
--   - ocr_usage: clients can only SELECT their own rows
--     (writes go through the increment_scan_count SECURITY DEFINER function)

-- Drop the overly permissive FOR ALL policies
DROP POLICY IF EXISTS "Users can manage own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can manage own usage" ON ocr_usage;
DROP POLICY IF EXISTS "Users can manage own scans" ON ocr_usage;

-- Also drop any leftover SELECT-only policies from previous migrations
DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can read own usage" ON ocr_usage;

-- Recreate as SELECT-only
CREATE POLICY "Users can read own subscription" ON user_subscriptions
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');

CREATE POLICY "Users can read own usage" ON ocr_usage
  FOR SELECT USING (user_id = auth.jwt() ->> 'sub');
