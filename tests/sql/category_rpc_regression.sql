-- Category RPC regression test (real PostgreSQL). NOT run automatically.
-- Run against a LOCAL or scratch Supabase DB after ALL migrations are applied:
--   psql "$LOCAL_DB_URL" -v ON_ERROR_STOP=1 -f tests/sql/category_rpc_regression.sql
-- Needs a role that can insert into auth.users and SET ROLE (local `postgres`).
-- Runs in ONE transaction that ends in ROLLBACK: nothing is kept.
-- NEVER point this at production.
begin;

create function pg_temp.check(cond boolean, msg text) returns void language plpgsql as $f$
begin
  if cond is not true then raise exception 'FAIL: %', msg; end if;
  raise notice 'PASS: %', msg;
end $f$;

create function pg_temp.as_user(u uuid) returns void language plpgsql as $f$
begin
  perform set_config('request.jwt.claims',
    case when u is null then '{"role":"authenticated"}'
         else json_build_object('sub', u, 'role', 'authenticated')::text end, true);
  execute 'set local role authenticated';
end $f$;

do $t$
declare
  ua uuid := '00000000-0000-4000-8000-0000000000a1';
  ub uuid := '00000000-0000-4000-8000-0000000000b2';
  c_travel uuid := '00000000-0000-4000-8000-00000000ca01'; -- A: Travel
  c_work   uuid := '00000000-0000-4000-8000-00000000ca02'; -- A: Work
  c_btrav  uuid := '00000000-0000-4000-8000-00000000cb01'; -- B: Travel
  g_linked uuid := '00000000-0000-4000-8000-000000000a01';
  g_legacy uuid := '00000000-0000-4000-8000-000000000a02';
  g_simil  uuid := '00000000-0000-4000-8000-000000000a03';
  g_work   uuid := '00000000-0000-4000-8000-000000000a04';
  g_bleg   uuid := '00000000-0000-4000-8000-000000000b05';
  g_blink  uuid := '00000000-0000-4000-8000-000000000b06';
  n_linked uuid := '00000000-0000-4000-8000-000000000e01';
  n_legacy uuid := '00000000-0000-4000-8000-000000000e02';
  n_simil  uuid := '00000000-0000-4000-8000-000000000e03';
  n_bleg   uuid := '00000000-0000-4000-8000-000000000f04';
  r public.categories;
  st text;
begin
  insert into auth.users (id, email) values (ua, 'a@test.invalid'), (ub, 'b@test.invalid');
  insert into public.categories (id, user_id, name) values
    (c_travel, ua, 'Travel'), (c_work, ua, 'Work'), (c_btrav, ub, 'Travel');
  insert into public.goals (id, user_id, title, category, category_id) values
    (g_linked, ua, 'linked',   'Travel',       c_travel),
    (g_legacy, ua, 'legacy',   ' travel ',     null),
    (g_simil,  ua, 'similar',  'Travel Plans', null),
    (g_work,   ua, 'work',     'Work',         c_work),
    (g_bleg,   ub, 'B legacy', 'Travel',       null),
    (g_blink,  ub, 'B linked', 'Travel',       c_btrav);
  insert into public.notes (id, user_id, title, category, category_id) values
    (n_linked, ua, 'linked',   'Travel',       c_travel),
    (n_legacy, ua, 'legacy',   'TRAVEL',       null),
    (n_simil,  ua, 'similar',  'Travel Plans', null),
    (n_bleg,   ub, 'B legacy', 'Travel',       null);

  -- 1. RENAME: linked + legacy rows follow; unrelated + other user untouched
  perform pg_temp.as_user(ua);
  r := public.update_category(c_travel, '  Trips ', '#112233');
  reset role;
  perform pg_temp.check(r.name = 'Trips' and r.color = '#112233' and r.id = c_travel, 'rename returns saved row');
  perform pg_temp.check((select name from public.categories where id = c_travel) = 'Trips', 'rename persisted in categories');
  perform pg_temp.check((select category from public.goals where id = g_linked) = 'Trips', 'rename: linked goal text updated');
  perform pg_temp.check((select category from public.notes where id = n_linked) = 'Trips', 'rename: linked note text updated');
  perform pg_temp.check((select category from public.goals where id = g_legacy) = 'Trips'
    and (select category_id from public.goals where id = g_legacy) = c_travel, 'rename: legacy goal (NULL id, " travel ") updated and linked');
  perform pg_temp.check((select category from public.notes where id = n_legacy) = 'Trips'
    and (select category_id from public.notes where id = n_legacy) = c_travel, 'rename: legacy note (NULL id, "TRAVEL") updated and linked');
  perform pg_temp.check((select category from public.goals where id = g_simil) = 'Travel Plans'
    and (select category_id from public.goals where id = g_simil) is null, 'rename: similar-name goal untouched');
  perform pg_temp.check((select category from public.notes where id = n_simil) = 'Travel Plans', 'rename: similar-name note untouched');
  perform pg_temp.check((select category from public.goals where id = g_work) = 'Work', 'rename: other category goal untouched');
  perform pg_temp.check((select name from public.categories where id = c_btrav) = 'Travel'
    and (select category from public.goals where id = g_bleg) = 'Travel'
    and (select category from public.goals where id = g_blink) = 'Travel'
    and (select category from public.notes where id = n_bleg) = 'Travel', 'rename: user B data untouched');

  -- 2. Another user's category id -> P0002, nothing changes
  perform pg_temp.as_user(ua);
  begin
    perform public.update_category(c_btrav, 'Hacked', null);
    st := 'no-error';
  exception when others then st := sqlstate; end;
  reset role;
  perform pg_temp.check(st = 'P0002', 'rename of another user''s category is rejected (P0002)');
  perform pg_temp.check((select name from public.categories where id = c_btrav) = 'Travel', 'other user''s category unchanged');

  -- 3. No authenticated user -> 28000
  perform pg_temp.as_user(null);
  begin
    perform public.update_category(c_travel, 'X', null);
    st := 'no-error';
  exception when others then st := sqlstate; end;
  reset role;
  perform pg_temp.check(st = '28000', 'rename without auth.uid() is rejected (28000)');

  -- 4. ROLLBACK: force a failure AFTER the categories+goals writes (on the notes update)
  create function pg_temp.boom() returns trigger language plpgsql as $b$
  begin if new.category = 'Boom' then raise exception 'forced failure' using errcode = 'P0001'; end if; return new; end $b$;
  create trigger zz_boom before update on public.notes for each row execute function pg_temp.boom();
  perform pg_temp.as_user(ua);
  begin
    perform public.update_category(c_travel, 'Boom', null);
    st := 'no-error';
  exception when others then st := sqlstate; end;
  reset role;
  drop trigger zz_boom on public.notes;
  perform pg_temp.check(st = 'P0001', 'forced failure surfaced');
  perform pg_temp.check((select name from public.categories where id = c_travel) = 'Trips', 'rollback: category name restored');
  perform pg_temp.check((select category from public.goals where id = g_linked) = 'Trips'
    and (select category from public.goals where id = g_legacy) = 'Trips', 'rollback: goal writes undone');

  -- 5. Duplicate name (case-insensitive) -> 23505, nothing changes
  perform pg_temp.as_user(ua);
  begin
    perform public.update_category(c_work, ' trips ', null);
    st := 'no-error';
  exception when others then st := sqlstate; end;
  reset role;
  perform pg_temp.check(st = '23505', 'duplicate rename rejected (23505)');
  perform pg_temp.check((select name from public.categories where id = c_work) = 'Work'
    and (select category from public.goals where id = g_work) = 'Work', 'duplicate rename changed nothing');

  -- 6. DELETE another user's category -> P0002
  perform pg_temp.as_user(ua);
  begin
    perform public.delete_category(c_btrav);
    st := 'no-error';
  exception when others then st := sqlstate; end;
  reset role;
  perform pg_temp.check(st = 'P0002', 'delete of another user''s category rejected (P0002)');
  perform pg_temp.check(exists (select 1 from public.categories where id = c_btrav), 'other user''s category still exists');

  -- 7. DELETE own category: linked + legacy rows cleared, rows kept
  perform pg_temp.as_user(ua);
  perform public.delete_category(c_travel);
  reset role;
  perform pg_temp.check(not exists (select 1 from public.categories where id = c_travel), 'delete: category removed');
  perform pg_temp.check((select count(*) from public.goals where id in (g_linked, g_legacy, g_simil, g_work)) = 4, 'delete: all goals kept');
  perform pg_temp.check((select count(*) from public.notes where id in (n_linked, n_legacy, n_simil)) = 3, 'delete: all notes kept');
  perform pg_temp.check((select category from public.goals where id = g_linked) = ''
    and (select category_id from public.goals where id = g_linked) is null, 'delete: linked goal cleared');
  perform pg_temp.check((select category from public.goals where id = g_legacy) = '', 'delete: legacy goal text cleared');
  perform pg_temp.check((select category from public.notes where id = n_linked) is null
    and (select category_id from public.notes where id = n_linked) is null, 'delete: linked note cleared');
  perform pg_temp.check((select category from public.notes where id = n_legacy) is null, 'delete: legacy note text cleared');
  perform pg_temp.check((select category from public.goals where id = g_simil) = 'Travel Plans'
    and (select category from public.notes where id = n_simil) = 'Travel Plans', 'delete: similar-name rows untouched');
  perform pg_temp.check((select category from public.goals where id = g_work) = 'Work'
    and exists (select 1 from public.categories where id = c_work), 'delete: unrelated category and goal untouched');
  perform pg_temp.check((select category from public.goals where id = g_bleg) = 'Travel'
    and (select category from public.goals where id = g_blink) = 'Travel'
    and (select category from public.notes where id = n_bleg) = 'Travel', 'delete: user B data untouched');
end $t$;

rollback;
