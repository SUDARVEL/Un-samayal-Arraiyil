-- Onboarding data for Samayal Arayayil.
-- Tables are prefixed with samayal_ because the Supabase project is shared with another app.
-- Users sign in anonymously (Authentication → Sign In / Providers → "Allow anonymous sign-ins").

create table if not exists public.samayal_profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.samayal_households (
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.samayal_household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.samayal_households (id) on delete cascade,
  name text not null,
  dislikes text[] not null default '{}',
  created_at timestamptz not null default now()
);

create index if not exists samayal_household_members_household_id_idx
  on public.samayal_household_members (household_id);

-- Signed-in users (including anonymous ones) may use the tables; RLS below limits them to their own rows.
grant select, insert, update, delete on public.samayal_profiles to authenticated;
grant select, insert, update, delete on public.samayal_households to authenticated;
grant select, insert, update, delete on public.samayal_household_members to authenticated;

alter table public.samayal_profiles enable row level security;
alter table public.samayal_households enable row level security;
alter table public.samayal_household_members enable row level security;

create policy "samayal: own profile" on public.samayal_profiles
  for all to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "samayal: own household" on public.samayal_households
  for all to authenticated
  using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

create policy "samayal: members of own household" on public.samayal_household_members
  for all to authenticated
  using (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ));
