-- Ще поля вакансії: пріоритет, вилка ЗП (мін-макс), формат роботи,
-- причина відкриття, рівень, необхідні навички (для матчингу з кандидатами).
-- Застосувати: Supabase → SQL Editor → Run.
alter table jobs add column if not exists priority text;       -- high / medium / low
alter table jobs add column if not exists salary_min integer;
alter table jobs add column if not exists salary_max integer;
alter table jobs add column if not exists work_format text;    -- office / remote / hybrid
alter table jobs add column if not exists open_reason text;    -- new / replacement / expansion
alter table jobs add column if not exists level text;          -- junior / middle / senior
alter table jobs add column if not exists skills text[];
create index if not exists jobs_skills_idx on jobs using gin (skills);
