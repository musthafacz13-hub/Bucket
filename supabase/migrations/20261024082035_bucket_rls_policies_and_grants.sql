alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.categories enable row level security;
alter table public.goals enable row level security;
alter table public.notes enable row level security;

-- Grants (separate from RLS): Supabase default privileges give anon/authenticated broad access, so reset.
revoke all on table public.profiles, public.user_preferences, public.categories, public.goals, public.notes
  from public, anon, authenticated;

grant select, insert, update, delete on public.user_preferences, public.categories, public.goals, public.notes
  to authenticated;
-- Profiles are created by the signup trigger and removed via auth.users cascade; clients may read
-- their own row and edit only display_name.
grant select on public.profiles to authenticated;
grant update (display_name) on public.profiles to authenticated;

-- profiles
create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- user_preferences
create policy user_preferences_select_own on public.user_preferences for select to authenticated
  using ((select auth.uid()) = user_id);
create policy user_preferences_insert_own on public.user_preferences for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy user_preferences_update_own on public.user_preferences for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy user_preferences_delete_own on public.user_preferences for delete to authenticated
  using ((select auth.uid()) = user_id);

-- categories
create policy categories_select_own on public.categories for select to authenticated
  using ((select auth.uid()) = user_id);
create policy categories_insert_own on public.categories for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy categories_update_own on public.categories for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy categories_delete_own on public.categories for delete to authenticated
  using ((select auth.uid()) = user_id);

-- goals
create policy goals_select_own on public.goals for select to authenticated
  using ((select auth.uid()) = user_id);
create policy goals_insert_own on public.goals for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy goals_update_own on public.goals for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy goals_delete_own on public.goals for delete to authenticated
  using ((select auth.uid()) = user_id);

-- notes
create policy notes_select_own on public.notes for select to authenticated
  using ((select auth.uid()) = user_id);
create policy notes_insert_own on public.notes for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy notes_update_own on public.notes for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy notes_delete_own on public.notes for delete to authenticated
  using ((select auth.uid()) = user_id);
