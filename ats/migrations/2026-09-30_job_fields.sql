-- Додаткові поля вакансії: бюджет ЗП, кількість місць, бажана дата закриття.
-- (hiring_manager_id / recruiter_id вже додані міграцією job_team.)
-- Застосувати: Supabase → SQL Editor → Run.
alter table jobs add column if not exists salary_budget integer;
alter table jobs add column if not exists openings integer default 1;
alter table jobs add column if not exists target_close_date date;
