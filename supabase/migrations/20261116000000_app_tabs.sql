-- A1–A6 app screens: family votes, meal parts, "made it?" history, kitchen stock, member tastes.

-- Plans: who wants which idea (member name → 'want' | 'not_again' per dish), when the family was
-- asked, swapped meal parts, and what was actually cooked.
alter table public.samayal_plans
  add column if not exists votes jsonb not null default '{}'::jsonb,
  add column if not exists asked_at timestamptz,
  add column if not exists parts jsonb not null default '{}'::jsonb,
  add column if not exists made text check (made in ('yes', 'other')),
  add column if not exists made_dish_id text;

-- Members: dishes they love and dishes they don't want again for a while.
alter table public.samayal_household_members
  add column if not exists loves text[] not null default '{}',
  add column if not exists not_again text[] not null default '{}';

-- Owner's own tastes (the cook is not a row in samayal_household_members) and bookmarked dishes.
alter table public.samayal_households
  add column if not exists owner_loves text[] not null default '{}',
  add column if not exists owner_not_again text[] not null default '{}',
  add column if not exists saved_dish_ids text[] not null default '{}';

-- Kitchen: one row per vegetable with its stock state.
create table if not exists public.samayal_pantry (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.samayal_households (id) on delete cascade,
  item text not null,
  state text not null default 'have' check (state in ('have', 'low', 'out')),
  updated_at timestamptz not null default now(),
  unique (household_id, item)
);

grant select, insert, update, delete on public.samayal_pantry to authenticated;

alter table public.samayal_pantry enable row level security;

create policy "samayal: pantry of own household" on public.samayal_pantry
  for all to authenticated
  using (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ));
