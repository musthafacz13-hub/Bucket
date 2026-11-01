-- Category consistency fix.
-- Problem: goals.category / notes.category duplicate the category name as text. Renaming or
-- deleting a category only changed public.categories, so the copied text drifted after refresh.
-- Fix: two SECURITY INVOKER functions (RLS still applies, caller must own every row).
-- Each function runs in one transaction: all writes succeed or none do.
-- Safe to re-run. No data is dropped.

create or replace function public.update_category(p_id uuid, p_name text, p_color text)
returns public.categories
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_name text := btrim(p_name);
  v_row public.categories;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  update public.categories
     set name = v_name,
         color = coalesce(p_color, color)
   where id = p_id and user_id = v_uid
   returning * into v_row;

  if not found then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;

  update public.goals
     set category = v_row.name
   where category_id = p_id and user_id = v_uid and category is distinct from v_row.name;

  update public.notes
     set category = v_row.name
   where category_id = p_id and user_id = v_uid and category is distinct from v_row.name;

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
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  -- Goals and notes are KEPT. Only their category label is cleared.
  -- category_id is nulled by the existing ON DELETE SET NULL foreign keys.
  update public.goals set category = '' where category_id = p_id and user_id = v_uid;
  update public.notes set category = null where category_id = p_id and user_id = v_uid;

  delete from public.categories where id = p_id and user_id = v_uid;

  if not found then
    raise exception 'Category not found' using errcode = 'P0002';
  end if;
end;
$$;

revoke execute on function public.update_category(uuid, text, text) from public, anon;
revoke execute on function public.delete_category(uuid) from public, anon;
grant execute on function public.update_category(uuid, text, text) to authenticated;
grant execute on function public.delete_category(uuid) to authenticated;

-- One-time repair of rows that already drifted (name copied before a rename).
update public.goals g set category = c.name
  from public.categories c
 where g.category_id = c.id and g.user_id = c.user_id and g.category is distinct from c.name;

update public.notes n set category = c.name
  from public.categories c
 where n.category_id = c.id and n.user_id = c.user_id and n.category is distinct from c.name;
