-- Навички кандидата (для пошуку), LinkedIn, досвід.
-- Застосувати: Supabase → SQL Editor → Run.
alter table candidates add column if not exists skills text[];
alter table candidates add column if not exists linkedin text;
alter table candidates add column if not exists experience text;

-- Індекс для пошуку за навичками (масив)
create index if not exists candidates_skills_idx on candidates using gin (skills);
