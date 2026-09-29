-- Додаткові поля профілю кандидата: локація, соцмережі, очікувана ЗП.
-- Застосувати: Supabase → SQL Editor → Run.
alter table candidates add column if not exists location text;
alter table candidates add column if not exists facebook text;
alter table candidates add column if not exists instagram text;
alter table candidates add column if not exists expected_salary integer;
