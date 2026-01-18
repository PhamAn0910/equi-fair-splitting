-- Fix RLS policies to allow INSERT/UPDATE operations
-- This fixes the 406 error on user_subscriptions and allows ocr_usage updates

-- Drop existing policies (both old and new names in case migration was run before)
DROP POLICY IF EXISTS "Users can read own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can manage own subscription" ON user_subscriptions;
DROP POLICY IF EXISTS "Users can read own usage" ON ocr_usage;
DROP POLICY IF EXISTS "Users can manage own usage" ON ocr_usage;

-- Recreate user_subscriptions policy with full access (SELECT, INSERT, UPDATE)
-- Users can read, insert, and update their own subscription records
CREATE POLICY "Users can manage own subscription" ON user_subscriptions
  FOR ALL 
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

-- Recreate ocr_usage policy with full access (SELECT, INSERT, UPDATE)
-- Users can read, insert, and update their own usage records
CREATE POLICY "Users can manage own usage" ON ocr_usage
  FOR ALL 
  USING (user_id = auth.jwt() ->> 'sub')
  WITH CHECK (user_id = auth.jwt() ->> 'sub');

