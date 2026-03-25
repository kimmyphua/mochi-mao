create extension if not exists pgcrypto;

create table if not exists public.scores (
  id uuid primary key default gen_random_uuid(),
  player_name text not null check (char_length(player_name) between 1 and 48),
  score integer not null,
  difficulty text not null check (difficulty in ('easy', 'normal', 'hard')),
  created_at timestamptz not null default now()
);

alter table public.scores enable row level security;

drop policy if exists "Public can read scores" on public.scores;
create policy "Public can read scores"
on public.scores
for select
to anon, authenticated
using (true);

drop policy if exists "Public can insert scores" on public.scores;
create policy "Public can insert scores"
on public.scores
for insert
to anon, authenticated
with check (
  char_length(player_name) between 1 and 48
  and difficulty in ('easy', 'normal', 'hard')
);
