-- Onboarding data for Samayal Arayayil.
-- Run in the Supabase SQL editor, or with `supabase db push`.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  whatsapp_opt_in boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null unique references auth.users (id) on delete cascade,
  household_type text not null check (household_type in
    ('just_me', 'two_of_us', 'family_kids', 'joint_family', 'roommates', 'cook_helps')),
  people_count int not null check (people_count between 1 and 30),
  diet text not null check (diet in ('Vegetarian', 'Eggetarian', 'Non-veg', 'Jain', 'Vegan')),
  allergies text[] not null default '{}',
  usual_dishes text[] not null default '{}',
  dislikes text[] not null default '{}',
  plan_time text not null check (plan_time in ('night_before', 'morning', 'it_changes')),
  reminder_time text not null,
  reminders_enabled boolean not null default false,
  invite_code text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  created_at timestamptz not null default now()
);

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.households (id) on delete cascade,
  name text not null,
  dislikes text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.households enable row level security;
alter table public.household_members enable row level security;

create policy "own profile" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own household" on public.households
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

create policy "members of own household" on public.household_members
  for all using (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid())
  ) with check (
    exists (select 1 from public.households h where h.id = household_id and h.owner_id = auth.uid())
  );
