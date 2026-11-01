-- Corrective migration (do NOT edit 20261028090000: it may already be applied).
-- Fixes update_category() / delete_category() so legacy rows are handled too:
-- goals/notes with category_id IS NULL but a stored category text equal to the category name.
-- Matching is trimmed + case-insensitive, same rule as the categories unique index
-- (user_id, lower(btrim(name))), so it can never match a different category of the same user.
-- Both functions stay SECURITY INVOKER: RLS applies, and every statement is also pinned to auth.uid().
-- Each call is one transaction: any failure rolls back every write.
-- No data is deleted. Safe to re-run.

create or replace function public.update_category(p_id uuid, p_name text, p_color text)
returns public.categories
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_new_name text := btrim(p_name);
  v_old_name text;
  v_old_key text;
  v_row public.categories;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if v_new_name is null or v_new_name = '' then
    raise exception 'Invalid category name' using errcode = '22023';
  end if;

  -- Verify ownership and capture the ORIGINAL name before it changes. Lock the row.
  select name into v_old_name
    from public.categories
   where id = p_id and user_id = v_uid
   for update;

  if not found then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  v_old_key := lower(btrim(v_old_name));

  update public.categories
     set name = v_new_name,
         color = coalesce(p_color, color)
   where id = p_id and user_id = v_uid
   returning * into v_row;

  -- Linked rows, plus legacy unlinked rows whose text matches the old name. Link the legacy rows.
  update public.goals
     set category = v_row.name,
         category_id = p_id
   where user_id = v_uid
     and (category_id = p_id
          or (category_id is null and lower(btrim(category)) = v_old_key))
     and (category is distinct from v_row.name or category_id is distinct from p_id);

  update public.notes
     set category = v_row.name,
         category_id = p_id
   where user_id = v_uid
     and (category_id = p_id
          or (category_id is null and lower(btrim(category)) = v_old_key))
     and (category is distinct from v_row.name or category_id is distinct from p_id);

  return v_row;
end;
$$;

create or replace function public.delete_category(p_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text;
  v_key text;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select name into v_name
    from public.categories
   where id = p_id and user_id = v_uid
   for update;

  if not found then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  v_key := lower(btrim(v_name));

  -- Goals and notes are KEPT. Only the category label is cleared.
  update public.goals
     set category = ''
   where user_id = v_uid
     and (category_id = p_id
          or (category_id is null and lower(btrim(category)) = v_key));

  update public.notes
     set category = null
   where user_id = v_uid
     and (category_id = p_id
          or (category_id is null and lower(btrim(category)) = v_key));

  -- Existing ON DELETE SET NULL (category_id) foreign keys unlink the linked rows.
  delete from public.categories where id = p_id and user_id = v_uid;
end;
$$;

revoke execute on function public.update_category(uuid, text, text) from public, anon;
revoke execute on function public.delete_category(uuid) from public, anon;
grant execute on function public.update_category(uuid, text, text) to authenticated;
grant execute on function public.delete_category(uuid) to authenticated;
