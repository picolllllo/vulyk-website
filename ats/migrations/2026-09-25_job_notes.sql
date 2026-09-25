-- Нотатки команди на вакансії (переписка HR у картці вакансії).
-- Застосувати: Supabase → SQL Editor → Run.
create table if not exists job_notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  author_id uuid references users(id),
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists job_notes_job_idx on job_notes(job_id);

alter table job_notes enable row level security;

drop policy if exists job_notes_hr on job_notes;
create policy job_notes_hr on job_notes for all
  using (public.is_hr()) with check (public.is_hr());

drop trigger if exists trg_job_notes_touch on job_notes;
create trigger trg_job_notes_touch
  before update on job_notes
  for each row execute function public.touch_updated_at();
