-- Довідник тегів кандидата (керований через Налаштування).
-- candidates.tag зберігає slug із цієї таблиці. Застосувати: Supabase → SQL Editor → Run.
create table if not exists candidate_tags (
  slug       text primary key,
  name       text not null,
  color      text not null default '#5b6673',
  sort_order int  not null default 0,
  created_at timestamptz not null default now()
);

alter table candidate_tags enable row level security;

drop policy if exists candidate_tags_read on candidate_tags;
create policy candidate_tags_read on candidate_tags for select using (true);

drop policy if exists candidate_tags_hr on candidate_tags;
create policy candidate_tags_hr on candidate_tags for all
  using (public.is_hr()) with check (public.is_hr());

-- Сід: наявні три теги (зберігаємо ті самі slug, щоб наявні кандидати не загубили тег)
insert into candidate_tags (slug, name, color, sort_order) values
  ('employee',    'Працівник',     '#1a7f37', 10),
  ('ex_employee', 'Екс-працівник', '#5b6673', 20),
  ('blacklist',   'Чорний список', '#b3261e', 30)
on conflict (slug) do nothing;
