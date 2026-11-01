-- Server-side AI scan quota
--
-- /api/scan-receipt checks and records quota itself through the service_role key,
-- using the functions below. Only service_role can execute them.
--
-- Run this BEFORE deploying the matching api/scan-receipt.ts change. It is additive:
-- the currently deployed client keeps working until the new code ships.
-- After that deploy, run 20261102_revoke_client_scan_rpc.sql.

-- Atomically check the limit and record one scan.
-- p_lifetime = true  -> limit applies to the sum of all days (free plan)
-- p_lifetime = false -> limit applies to today only (pro plan)
-- Returns true when the scan was recorded, false when the limit is reached.
CREATE OR REPLACE FUNCTION consume_scan_quota(p_user_id text, p_limit integer, p_lifetime boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
BEGIN
  -- Serialize concurrent scans for the same user so check + increment is atomic
  PERFORM pg_advisory_xact_lock(hashtext('scan_quota:' || p_user_id));

  SELECT COALESCE(SUM(scan_count), 0) INTO used
  FROM ocr_usage
  WHERE user_id = p_user_id
    AND (p_lifetime OR scan_date = current_date);

  IF used >= p_limit THEN
    RETURN false;
  END IF;

  INSERT INTO ocr_usage (user_id, scan_date, scan_count)
  VALUES (p_user_id, current_date, 1)
  ON CONFLICT (user_id, scan_date)
  DO UPDATE SET scan_count = ocr_usage.scan_count + 1;

  RETURN true;
END;
$$;

-- Give back a scan recorded by consume_scan_quota when the AI call failed.
CREATE OR REPLACE FUNCTION refund_scan(p_user_id text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE ocr_usage
  SET scan_count = GREATEST(scan_count - 1, 0)
  WHERE user_id = p_user_id
    AND scan_date = current_date;
$$;

REVOKE EXECUTE ON FUNCTION consume_scan_quota(text, integer, boolean) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION refund_scan(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION consume_scan_quota(text, integer, boolean) TO service_role;
GRANT EXECUTE ON FUNCTION refund_scan(text) TO service_role;
