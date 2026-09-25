-- Поле «Про кандидата» — вільний текст із загальної форми подачі та нотатки HR.
-- Застосувати: Supabase → SQL Editor → Run.
alter table candidates add column if not exists summary text;
