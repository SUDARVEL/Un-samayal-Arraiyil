-- One row per household per day and meal: the three ideas shown, ideas swapped away, and the pick.

create table if not exists public.samayal_plans (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.samayal_households (id) on delete cascade,
  plan_date date not null,
  meal text not null default 'breakfast' check (meal in ('breakfast', 'lunch', 'dinner')),
  option_ids text[] not null default '{}',
  rejected_ids text[] not null default '{}',
  chosen_id text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (household_id, plan_date, meal)
);

grant select, insert, update, delete on public.samayal_plans to authenticated;

alter table public.samayal_plans enable row level security;

create policy "samayal: plans of own household" on public.samayal_plans
  for all to authenticated
  using (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ));
