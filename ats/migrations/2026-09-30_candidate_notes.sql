-- Загальні нотатки команди в профілі кандидата (поза заявками).
-- Застосувати: Supabase → SQL Editor → Run.
create table if not exists candidate_notes (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  author_id uuid references users(id),
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists candidate_notes_cand_idx on candidate_notes(candidate_id);

alter table candidate_notes enable row level security;

drop policy if exists candidate_notes_hr on candidate_notes;
create policy candidate_notes_hr on candidate_notes for all
  using (public.is_hr()) with check (public.is_hr());

drop trigger if exists trg_candidate_notes_touch on candidate_notes;
create trigger trg_candidate_notes_touch
  before update on candidate_notes
  for each row execute function public.touch_updated_at();
