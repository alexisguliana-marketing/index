-- Wedding Univers — vendor profiles, portfolio, Wedding Match & ecosystem
-- graph (cahier des charges §11-19).

-- ─── Vendors (§11) ─────────────────────────────────────────────────────
create table public.vendors (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  tagline text,
  description text,
  city text,
  travel_radius_km integer,
  experience_years integer,
  capacity_min integer,
  capacity_max integer,
  rating_average numeric(2, 1),
  rating_count integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index vendors_owner_user_id_idx on public.vendors (owner_user_id);
create trigger set_vendors_updated_at
  before update on public.vendors
  for each row execute function public.set_updated_at();

-- ─── Categories, hierarchical (§12) ────────────────────────────────────
create table public.vendor_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  parent_id uuid references public.vendor_categories (id) on delete set null
);

create table public.vendor_category_assignments (
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  category_id uuid not null references public.vendor_categories (id) on delete cascade,
  primary key (vendor_id, category_id)
);

-- ─── Services & pricing (§11) ──────────────────────────────────────────
create table public.vendor_services (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  name text not null,
  description text,
  price numeric(10, 2) not null,
  created_at timestamptz not null default now()
);

create index vendor_services_vendor_id_idx on public.vendor_services (vendor_id);

-- ─── Coverage area & availability (§11, §16) ───────────────────────────
create table public.vendor_locations (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  city text not null,
  region text,
  country text not null default 'FR',
  latitude double precision,
  longitude double precision
);

create index vendor_locations_vendor_id_idx on public.vendor_locations (vendor_id);

create table public.vendor_availability (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  date date not null,
  is_available boolean not null default true,
  unique (vendor_id, date)
);

create index vendor_availability_vendor_id_idx on public.vendor_availability (vendor_id);

-- ─── Media & portfolio (§13) ────────────────────────────────────────────
create table public.media (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('photo', 'video')),
  storage_path text not null,
  uploaded_by_user_id uuid not null references public.profiles (id),
  vendor_id uuid references public.vendors (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index media_vendor_id_idx on public.media (vendor_id);
create index media_wedding_id_idx on public.media (wedding_id);

create table public.vendor_portfolio_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  service_id uuid references public.vendor_services (id) on delete set null,
  category_id uuid references public.vendor_categories (id) on delete set null,
  style text check (
    style in ('rustic', 'classic', 'boho', 'luxury', 'urban', 'beach', 'vintage', 'modern', 'other')
  ),
  -- The real wedding this media was shot at, when known (§13, feeds §22).
  wedding_id uuid references public.weddings (id) on delete set null,
  created_at timestamptz not null default now()
);

create index vendor_portfolio_items_vendor_id_idx on public.vendor_portfolio_items (vendor_id);

create table public.vendor_reviews (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id),
  rating integer not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (vendor_id, wedding_id, author_user_id)
);

create index vendor_reviews_vendor_id_idx on public.vendor_reviews (vendor_id);

-- Keep vendors.rating_average / rating_count in sync with reviews.
create or replace function public.refresh_vendor_rating()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_vendor_id uuid := coalesce(new.vendor_id, old.vendor_id);
begin
  update public.vendors v
  set rating_average = stats.avg_rating,
      rating_count = stats.review_count
  from (
    select avg(rating)::numeric(2, 1) as avg_rating, count(*) as review_count
    from public.vendor_reviews
    where vendor_id = target_vendor_id
  ) stats
  where v.id = target_vendor_id;
  return null;
end;
$$;

create trigger on_vendor_review_change
  after insert or update or delete on public.vendor_reviews
  for each row execute function public.refresh_vendor_rating();

-- ─── Wedding Match cache & vendor ecosystem graph (§16-19) ─────────────
create table public.matches (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  score integer not null check (score between 0 and 100),
  criteria jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now(),
  unique (wedding_id, vendor_id)
);

create index matches_wedding_id_idx on public.matches (wedding_id);
create index matches_vendor_id_idx on public.matches (vendor_id);

create table public.vendor_relationships (
  id uuid primary key default gen_random_uuid(),
  vendor_a_id uuid not null references public.vendors (id) on delete cascade,
  vendor_b_id uuid not null references public.vendors (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete set null,
  created_at timestamptz not null default now(),
  check (vendor_a_id <> vendor_b_id)
);

create index vendor_relationships_vendor_a_idx on public.vendor_relationships (vendor_a_id);
create index vendor_relationships_vendor_b_idx on public.vendor_relationships (vendor_b_id);

-- ─── Favorites & inspiration collections (§15, §20) ────────────────────
create table public.favorites (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid references public.vendors (id) on delete cascade,
  media_id uuid references public.media (id) on delete cascade,
  created_at timestamptz not null default now(),
  check (vendor_id is not null or media_id is not null)
);

create index favorites_wedding_id_idx on public.favorites (wedding_id);

create table public.collections (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  media_id uuid not null references public.media (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index collection_items_collection_id_idx on public.collection_items (collection_id);
