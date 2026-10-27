-- updated_at maintenance (SECURITY INVOKER, empty search_path)
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.user_preferences
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.categories
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.goals
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.notes
  for each row execute function public.set_updated_at();

-- completed_at: set on transition to Completed, cleared on reopen, preserved otherwise.
-- Clients cannot forge it on update. Plain SECURITY INVOKER.
create function public.goals_manage_completed_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    if new.status = 'Completed' then
      new.completed_at := coalesce(new.completed_at, now());
    else
      new.completed_at := null;
    end if;
  else
    if new.status = 'Completed' and old.status is distinct from 'Completed' then
      new.completed_at := now();
    elsif new.status <> 'Completed' then
      new.completed_at := null;
    else
      new.completed_at := old.completed_at;
    end if;
  end if;
  return new;
end;
$$;

create trigger goals_manage_completed_at before insert or update on public.goals
  for each row execute function public.goals_manage_completed_at();

-- Profile + default preferences on signup.
-- SECURITY DEFINER is required: the trigger runs inside Auth's signup transaction and must write
-- to public tables that users cannot insert into. Hardened: empty search_path, schema-qualified
-- names, EXECUTE revoked from all API roles. Metadata is used only for a cosmetic display name,
-- never for authorization.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), 100), '')
  );
  insert into public.user_preferences (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
