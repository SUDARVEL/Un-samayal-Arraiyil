-- Which meals a family's own dish is made for: breakfast, lunch, dinner.
alter table public.samayal_custom_dishes
  add column if not exists meals text[] not null default '{breakfast}';
