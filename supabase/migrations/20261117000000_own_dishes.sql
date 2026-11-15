-- Dishes a family adds themselves, and kitchen items they add, rename or remove.

create table if not exists public.samayal_custom_dishes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.samayal_households (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  -- Plate parts: [{ "role": "Base" | "Main" | "Side", "name": "..." }]
  parts jsonb not null default '[]'::jsonb,
  cook_mins int not null default 20 check (cook_mins between 1 and 600),
  needs_batter boolean not null default false,
  -- Diet / allergy tags, same words the built-in catalog uses (egg, fish, meat, onion, dairy, ...).
  tags text[] not null default '{}',
  -- How the drawn picture looks: { "shape": ..., "food": "#hex", "bg": "#hex" }
  art jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists samayal_custom_dishes_household_id_idx
  on public.samayal_custom_dishes (household_id);

grant select, insert, update, delete on public.samayal_custom_dishes to authenticated;

alter table public.samayal_custom_dishes enable row level security;

create policy "samayal: custom dishes of own household" on public.samayal_custom_dishes
  for all to authenticated
  using (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.samayal_households h
    where h.id = household_id and h.owner_id = (select auth.uid())
  ));

-- Kitchen: items can be hidden (removed or renamed away) and keep the order they were added in.
alter table public.samayal_pantry
  add column if not exists removed boolean not null default false,
  add column if not exists created_at timestamptz not null default now();
