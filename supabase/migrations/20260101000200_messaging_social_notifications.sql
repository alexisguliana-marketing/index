-- Wedding Univers — messaging, notifications, and the early social scaffolding
-- (cahier des charges §21-24). Social features stay structural-only in V1 per
-- the roadmap (V3); RLS below keeps them safe to leave dormant.

-- ─── Messaging: couple <-> vendor (§23) ────────────────────────────────
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  wedding_id uuid not null references public.weddings (id) on delete cascade,
  vendor_id uuid not null references public.vendors (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (wedding_id, vendor_id)
);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  participant_type text not null check (participant_type in ('couple', 'vendor')),
  primary key (conversation_id, user_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_user_id uuid not null references public.profiles (id),
  body text not null,
  attachment_media_id uuid references public.media (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

-- ─── Notifications (§24) ────────────────────────────────────────────────
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (
    type in (
      'task_created', 'task_overdue', 'invitation_received', 'member_joined',
      'new_message', 'vendor_reply', 'new_favorite', 'recommendation', 'project_activity'
    )
  ),
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on public.notifications (user_id);

-- ─── Social scaffolding (§21-22, structure only in V1) ─────────────────
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_user_id uuid references public.profiles (id) on delete cascade,
  author_vendor_id uuid references public.vendors (id) on delete cascade,
  wedding_id uuid references public.weddings (id) on delete cascade,
  text text,
  created_at timestamptz not null default now(),
  check (author_user_id is not null or author_vendor_id is not null)
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_user_id uuid not null references public.profiles (id),
  text text not null,
  created_at timestamptz not null default now()
);

create index comments_post_id_idx on public.comments (post_id);

create table public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
