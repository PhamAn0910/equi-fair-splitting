# Pre-migration backup: scan quota functions

Project: Supabase "Bill Split" (`nciyqemnfazppocdkybo`), captured 2026-11-01 12:51 (Asia/Saigon), before applying `supabase/migrations/20261101_server_side_scan_quota.sql`.

That migration is additive. It creates `consume_scan_quota` and `refund_scan` and changes no existing objects or rows. Before it ran, neither new function existed.

## Existing functions (unchanged by this migration)

Each function's ACL was `{=X/postgres,postgres=X/postgres,anon=X/postgres,authenticated=X/postgres,service_role=X/postgres}`, so PUBLIC, anon and authenticated could all execute it.

```sql
CREATE OR REPLACE FUNCTION public.increment_scan_count(p_user_id text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
begin
  insert into ocr_usage (user_id, scan_date, scan_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, scan_date)
  do update set scan_count = ocr_usage.scan_count + 1;
end;
$function$;

CREATE OR REPLACE FUNCTION public.get_today_scan_count(p_user_id text)
 RETURNS integer
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  select coalesce(sum(scan_count), 0)::integer
  from ocr_usage
  where user_id = p_user_id
  and scan_date = current_date;
$function$;
```

## `ocr_usage` state

- Columns: `id uuid default uuid_generate_v4()`, `user_id text`, `scan_date date default CURRENT_DATE`, `scan_count integer default 0`, and `created_at timestamptz default now()`.
- Constraints: `ocr_usage_pkey PRIMARY KEY (id)` and `ocr_usage_user_id_scan_date_key UNIQUE (user_id, scan_date)`.
- Policies: two SELECT-only policies for the row owner (`Users can read own usage` and `Users can view own usage`). `user_subscriptions` has the same pair.
- Rows: 7. They are not copied here because they contain user IDs, and the migration does not modify them.

## Applied migrations before this change

`remove_customer_id_unique_constraint`, `20260129_create_feedback_table`, `20260129_fix_feedback_rls_policies`, `tighten_rls_policies`, `tighten_rls_policies_v2`.

## Rollback

```sql
DROP FUNCTION IF EXISTS public.consume_scan_quota(text, integer, boolean);
DROP FUNCTION IF EXISTS public.refund_scan(text);
-- Only needed if 20261102_revoke_client_scan_rpc.sql was also applied:
GRANT EXECUTE ON FUNCTION public.increment_scan_count(text) TO PUBLIC, anon, authenticated;
```
