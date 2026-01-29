-- Drop existing policies that use auth.uid()
drop policy "Users can insert their own feedback" on public.feedback;
drop policy "Users can view their own feedback" on public.feedback;

-- Recreate policies using auth.jwt() ->> 'sub' to handle non-UUID (Clerk) user IDs
create policy "Users can insert their own feedback"
  on public.feedback for insert
  with check ( (select auth.jwt() ->> 'sub') = user_id );

create policy "Users can view their own feedback"
  on public.feedback for select
  using ( (select auth.jwt() ->> 'sub') = user_id );
