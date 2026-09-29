-- Тег кандидата поза вакансіями: працівник / екс-працівник / чорний список.
-- Порожній = без тегу (нові кандидати). Застосувати: Supabase → SQL Editor → Run.
alter table candidates add column if not exists tag text;
