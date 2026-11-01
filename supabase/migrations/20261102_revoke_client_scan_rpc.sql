-- Stop clients from changing scan counts directly
--
-- increment_scan_count is SECURITY DEFINER and accepts any p_user_id, so any
-- signed-in user could inflate another user's counter. The client stopped calling
-- it once /api/scan-receipt started recording scans via consume_scan_quota.
--
-- Run this AFTER the code that removes the client's increment_scan_count call is
-- deployed; running it earlier stops the old client from counting scans.

-- Lock down the old client-callable RPC (it may not exist in every project)
DO $$
BEGIN
  IF to_regprocedure('increment_scan_count(text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION increment_scan_count(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION increment_scan_count(text) TO service_role;
  END IF;
  -- Unused by the app; as SECURITY DEFINER it let anyone read any user's scan count
  IF to_regprocedure('get_today_scan_count(text)') IS NOT NULL THEN
    REVOKE EXECUTE ON FUNCTION get_today_scan_count(text) FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION get_today_scan_count(text) TO service_role;
  END IF;
END;
$$;
