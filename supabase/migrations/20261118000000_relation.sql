-- How each family member is related to the cook (Son, Mother-in-law, Roommate, ...).
alter table public.samayal_household_members
  add column if not exists relation text not null default '' check (char_length(relation) <= 40);
