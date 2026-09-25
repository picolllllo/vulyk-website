-- Тип зайнятості вакансії (напр. «Повна зайнятість · 5 год/день») — бейдж на сторінці.
-- Застосувати: Supabase → SQL Editor → Run.
alter table jobs add column if not exists employment text;
