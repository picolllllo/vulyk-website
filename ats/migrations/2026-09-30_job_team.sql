-- Ролі на вакансії: Hiring Manager та Відповідальний за вакансію.
-- Застосувати: Supabase → SQL Editor → Run.
alter table jobs add column if not exists hiring_manager_id uuid references users(id);
alter table jobs add column if not exists recruiter_id uuid references users(id);
