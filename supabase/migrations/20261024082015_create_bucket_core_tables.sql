-- Bucket core schema. Source of truth: src/types/index.ts and src/utils/storage.ts.
-- Account identity lives in auth.users; no duplicate users table.

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  theme text not null default 'light' check (theme in ('light', 'dark', 'system')),
  default_calendar_view text not null default 'month' check (default_calendar_view in ('month', 'week', 'day')),
  default_notes_view text not null default 'grid' check (default_notes_view in ('grid', 'list')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (
    char_length(btrim(name)) between 1 and 100
    and lower(btrim(name)) not in ('all', 'unassigned')
  ),
  color text not null default '#08C83D' check (color ~ '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_id_user_id_key unique (id, user_id)
);
create unique index categories_user_name_key on public.categories (user_id, lower(btrim(name)));

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  description text not null default '' check (char_length(description) <= 10000),
  category text not null default 'Personal' check (char_length(category) <= 100),
  category_id uuid,
  priority text not null default 'Medium' check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Not Started' check (status in ('Not Started', 'In Progress', 'Completed')),
  target_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint goals_id_user_id_key unique (id, user_id),
  -- Composite FK: a goal can only reference a category owned by the same user.
  -- Deleting a category nulls only category_id (never user_id) and keeps the goal.
  constraint goals_category_owner_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete set null (category_id),
  constraint goals_completed_at_matches_status check ((status = 'Completed') = (completed_at is not null))
);

create table public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 300),
  content text not null default '' check (char_length(content) <= 200000), -- Markdown, incl. checklists
  is_favorite boolean not null default false,
  linked_goal_id uuid,
  category_id uuid,
  category text check (category is null or char_length(category) <= 100),
  tags text[] not null default '{}' check (cardinality(tags) <= 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Deleting a goal/category unlinks the note instead of deleting it.
  constraint notes_goal_owner_fkey foreign key (linked_goal_id, user_id)
    references public.goals (id, user_id) on delete set null (linked_goal_id),
  constraint notes_category_owner_fkey foreign key (category_id, user_id)
    references public.categories (id, user_id) on delete set null (category_id)
);

-- Indexes (user_id leading for per-user listing; FK-covering indexes for unlink lookups)
create index goals_user_updated_idx on public.goals (user_id, updated_at desc);
create index goals_user_status_idx on public.goals (user_id, status);
create index goals_user_target_date_idx on public.goals (user_id, target_date) where target_date is not null;
create index goals_category_fk_idx on public.goals (category_id, user_id);
create index notes_user_updated_idx on public.notes (user_id, updated_at desc);
create index notes_user_favorite_idx on public.notes (user_id) where is_favorite;
create index notes_goal_fk_idx on public.notes (linked_goal_id, user_id);
create index notes_category_fk_idx on public.notes (category_id, user_id);
create index notes_tags_gin_idx on public.notes using gin (tags);
