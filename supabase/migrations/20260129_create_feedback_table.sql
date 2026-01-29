-- Create a table for user feedback
create table if not exists public.feedback (
  id uuid default gen_random_uuid() primary key,
  user_id text not null, -- aligning with other tables using text for user_id (Clerk ID)
  message text not null,
  type text default 'general', -- general, bug, feature
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.feedback enable row level security;

-- Create policies
create policy "Users can insert their own feedback"
  on public.feedback for insert
  with check (auth.uid()::text = user_id);

-- Depending on requirements, we might not want users to see all feedback, only their own, or maybe none?
-- For now, let's allow them to see their own feedback history if we ever build that UI.
create policy "Users can view their own feedback"
  on public.feedback for select
  using (auth.uid()::text = user_id);
