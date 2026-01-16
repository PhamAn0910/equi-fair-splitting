# Phase 3: Supabase Database Setup

**Estimated Time:** 3-4 hours

## 3.1 Database Schema (SQL)

Go to your Supabase Project -> **SQL Editor** -> **New Query**.
Paste and run the following SQL to set up your tables and security policies.

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. GROUPS TABLE
create table groups (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null, -- Matches Clerk User ID
  name text not null,
  currency text default 'USD',
  color_index integer default 0,
  created_at timestamptz default now()
);

-- 2. MEMBERS TABLE
create table members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  name text not null,
  color_hex text not null,
  is_admin boolean default false
);

-- 3. EXPENSES TABLE
create table expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references groups(id) on delete cascade,
  description text not null,
  total_amount numeric not null,
  payer_id uuid references members(id),
  date timestamptz default now(),
  category text not null,
  items jsonb default '[]'::jsonb, -- Store items as JSON
  splits jsonb default '[]'::jsonb  -- Store splits as JSON
);

-- 4. SUBSCRIPTIONS TABLE (For Lemon Squeezy)
create table user_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id text unique not null,
  lemonsqueezy_customer_id text unique,
  lemonsqueezy_order_id text,
  lemonsqueezy_subscription_id text,
  plan_type text default 'free',
  status text default 'active',
  variant_id text,
  current_period_end timestamptz,
  created_at timestamptz default now()
);

-- 5. OCR USAGE TABLE (Usage Limit Tracking)
create table ocr_usage (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  scan_date date not null default current_date,
  scan_count integer default 0,
  created_at timestamptz default now(),
  unique(user_id, scan_date)
);

-- ENABLE ROW LEVEL SECURITY (RLS)
alter table groups enable row level security;
alter table members enable row level security;
alter table expenses enable row level security;
alter table user_subscriptions enable row level security;
alter table ocr_usage enable row level security;

-- DEFINE ACCESS POLICIES

-- Groups: Users can only see/edit their own groups
create policy "Users can all on own groups" on groups
  for all using (user_id = auth.jwt() ->> 'sub');

-- Members: Accessible if user owns the group
create policy "Users can all on members of own groups" on members
  for all using (group_id in (
    select id from groups where user_id = auth.jwt() ->> 'sub'
  ));

-- Expenses: Accessible if user owns the group
create policy "Users can all on expenses of own groups" on expenses
  for all using (group_id in (
    select id from groups where user_id = auth.jwt() ->> 'sub'
  ));

-- Subscriptions: Users can read their own
create policy "Users can read own subscription" on user_subscriptions
  for select using (user_id = auth.jwt() ->> 'sub');

-- OCR Usage: Users can read their own
create policy "Users can read own usage" on ocr_usage
  for select using (user_id = auth.jwt() ->> 'sub');

-- FUNCTIONS
-- Helper to increment scan count safely
create or replace function increment_scan_count(p_user_id text)
returns void as $$
begin
  insert into ocr_usage (user_id, scan_date, scan_count)
  values (p_user_id, current_date, 1)
  on conflict (user_id, scan_date) 
  do update set scan_count = ocr_usage.scan_count + 1;
end;
$$ language plpgsql security definer;

-- Helper to get today's count
create or replace function get_today_scan_count(p_user_id text)
returns integer as $$
  select coalesce(sum(scan_count), 0)::integer
  from ocr_usage 
  where user_id = p_user_id 
  and scan_date = current_date;
$$ language sql security definer;
```

## 3.2 Configure Clerk Integration

This step is CRITICAL for RLS to work.

1. Go to **[Clerk Dashboard](https://dashboard.clerk.com) -> Configure -> JWT Templates**.
2. Click **New Template** -> Select **Supabase**.
3. Name it `supabase` (default).
4. Copy the **Signing Key** from your Supabase Project Settings -> API -> JWT Settings -> JWT Secret, and paste it into the Clerk "Signing Key" field if asked (or vice versa depending on setup wizard). 
   * *Better approach:* Clerk usually generates the key. Copy the **Signing Key** from Clerk.
   * Go to **Supabase Dashboard -> Settings -> API -> JWT Settings**.
   * Replace the **JWT Secret** with the one from Clerk. (Warning: this invalidates old tokens if any).
5. In the JWT template in Clerk, ensure the claim is formatted correctly:
```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "sub": "{{user.id}}"
}
```

## 3.3 Create Authenticated Client

Create `src/lib/supabase/client.ts`. This client will inject the Clerk token into every request.

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const createSupabaseClient = async (getToken: any) => {
  const token = await getToken({ template: 'supabase' });
  
  return createClient(supabaseUrl, supabaseKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });
};

// Also export a basic client for public data if needed (though RLS blocks it)
export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 3.4 Update Zustand Stores (Migration Example)

We need to update stores to fetch from Supabase.

Check `src/stores/groupStore.ts`. We will add a sync function.

```typescript
// Example pattern for your stores
import { createSupabaseClient } from '@/lib/supabase/client';

// In your component or a custom hook
const { getToken, userId } = useAuth();

useEffect(() => {
  if (!userId) return;
  
  const loadData = async () => {
    const supabase = await createSupabaseClient(getToken);
    const { data } = await supabase.from('groups').select('*');
    // Update zustand store
    useGroupStore.getState().setGroups(data);
  };
  
  loadData();
}, [userId]);
```

**Strategy:** 
Instead of rewriting all stores immediately, create a "SyncManager" component that runs on `Dashboard` mount, fetches data from Supabase, and populates the existing Zustand stores.

## Checklist
- [ ] SQL Schema executed in Supabase
- [ ] RLS Policies enabled
- [ ] Clerk JWT Template created
- [ ] Supabase JWT Secret updated (if needed)
- [ ] `createSupabaseClient` implemented
