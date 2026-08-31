-- Wedding Univers — initial schema (cahier des charges §29).
--
-- Scope decisions made while translating the spec's entity list into a real
-- relational schema (documented in PROJECT_STATUS.md as well):
--   * "users" -> Supabase-managed `auth.users` + a `public.profiles` extension
--     table. A separate `users` table would duplicate what Auth already owns.
--   * "couples" -> not a distinct table. The two partners are simply the
--     `wedding_members` rows with role = 'admin' (matches the §10 example:
--     "Alexis & Julie — Administrateurs").
--   * "wedding_roles" -> role slugs are a fixed, code-owned enum
--     (packages/config/src/permissions.ts) rather than an admin-editable DB
--     table, since V1 has no UI for custom roles. Enforced here with a CHECK
--     constraint; easy to promote to a real table later without breaking
--     `wedding_members.role`.
--   * "budgets" -> modeled as a computed view (`budget_summary`) instead of a
--     stored table: §8 explicitly describes it as *calculated* (total spent,
--     remaining, committed, % used), and `weddings.budget_total` already
--     holds the global envelope entered at wedding creation (§4).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─── Profiles ────────────────────────────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─── Weddings ────────────────────────────────────────────────────────────
create table public.weddings (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id),
  partner1_first_name text not null,
  partner2_first_name text not null,
  date date,
  is_date_flexible boolean not null default false,
  location text,
  is_venue_known boolean not null default false,
  guest_count_estimate integer,
  budget_total numeric(12, 2),
  style text check (
    style in ('rustic', 'classic', 'boho', 'luxury', 'urban', 'beach', 'vintage', 'modern', 'other')
  ),
  ceremony_type text check (ceremony_type in ('religious', 'civil', 'secular', 'other')),
  budget_tier text check (budget_tier in ('economical', 'moderate', 'premium', 'luxury')),
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_weddings_updated_at
  before update on public.weddings
  for each row execute function public.set_updated_at();

create table public.wedding_members (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('admin', 'witness', 'planner', 'guest_manager', 'member')),
  invited_at timestamptz not null default now(),
  joined_at timestamptz,
  unique (wedding_id, user_id)
);

create index wedding_members_wedding_id_idx on public.wedding_members (wedding_id);
create index wedding_members_user_id_idx on public.wedding_members (user_id);

-- Creating a wedding automatically makes its creator an admin member.
create or replace function public.handle_new_wedding()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.wedding_members (wedding_id, user_id, role, joined_at)
  values (new.id, new.created_by, 'admin', now());
  return new;
end;
$$;

create trigger on_wedding_created
  after insert on public.weddings
  for each row execute function public.handle_new_wedding();

-- ─── Task categories (shared taxonomy for tasks & budget items, §6/§29) ───
create table public.task_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  sort_order integer not null default 0
);

-- ─── Tasks & planning (§6-7) ───────────────────────────────────────────────
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  title text not null,
  description text,
  category_id uuid not null references public.task_categories (id),
  due_date date,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  status text not null default 'todo' check (status in ('todo', 'in_progress', 'done')),
  assignee_member_id uuid references public.wedding_members (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index tasks_wedding_id_idx on public.tasks (wedding_id);
create trigger set_tasks_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- ─── Budget (§8) ────────────────────────────────────────────────────────
create table public.budget_items (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  category_id uuid not null references public.task_categories (id),
  label text not null,
  planned numeric(12, 2) not null default 0,
  spent numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index budget_items_wedding_id_idx on public.budget_items (wedding_id);
create trigger set_budget_items_updated_at
  before update on public.budget_items
  for each row execute function public.set_updated_at();

-- Computed budget summary (§8: totals are calculated, never stored).
create view public.budget_summary as
select
  w.id as wedding_id,
  w.budget_total as total,
  coalesce(sum(bi.spent), 0) as spent,
  coalesce(sum(bi.planned) filter (where bi.spent = 0), 0) as committed,
  w.budget_total - coalesce(sum(bi.spent), 0) as remaining,
  case
    when w.budget_total is null or w.budget_total = 0 then null
    else round(coalesce(sum(bi.spent), 0) / w.budget_total * 100, 1)
  end as percent_used
from public.weddings w
left join public.budget_items bi on bi.wedding_id = w.id
group by w.id;

-- ─── Guests (§9) ────────────────────────────────────────────────────────
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  first_name text not null,
  last_name text not null,
  "group" text not null check ("group" in ('family', 'friends', 'colleagues', 'witnesses', 'other')),
  email text,
  phone text,
  rsvp_status text not null default 'pending' check (rsvp_status in ('pending', 'confirmed', 'declined')),
  plus_one boolean not null default false,
  children_count integer not null default 0,
  needs_accommodation boolean not null default false,
  meal_preference text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index guests_wedding_id_idx on public.guests (wedding_id);
create trigger set_guests_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();
