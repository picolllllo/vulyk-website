-- ============================================================================
--  ATS «Вулик» — схема бази даних (Supabase / PostgreSQL)
--  Ролі: hr (внутрішній), agency (зовнішня рекрутингова агенція), публіка.
--  Публічні записи (форми подачі) робляться через Edge Function із service-key,
--  що обходить RLS — тому anon-політик на запис немає (лише читання довідників).
--  Застосувати: Supabase → SQL Editor → вставити весь файл → Run.
-- ============================================================================

create extension if not exists pgcrypto;   -- gen_random_uuid()

-- ── Типи-статуси ────────────────────────────────────────────────────────────
create type job_status  as enum ('draft','open','paused','closed');            -- чернетка/відкрита/пауза/закрита
create type app_stage   as enum ('new','review','interview','offer','rejected','hired');
create type user_role   as enum ('hr','agency');
create type cand_source as enum ('direct','agency','referral','other');        -- звідки прийшов

-- ── Агенції ─────────────────────────────────────────────────────────────────
create table agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  contact_email text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

-- ── Користувачі (профіль поверх auth.users) ─────────────────────────────────
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text unique not null,
  role user_role not null default 'hr',
  agency_id uuid references agencies(id),          -- заповнюється лише для role='agency'
  created_at timestamptz not null default now()
);

-- ── Позиції (керований довідник для загальної форми та фільтра профілів) ─────
create table positions (
  id serial primary key,
  name text unique not null,
  active boolean not null default true,            -- у формі показуємо лише active
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ── Вакансії ────────────────────────────────────────────────────────────────
create table jobs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  location text,
  status job_status not null default 'draft',
  created_by uuid references users(id),
  created_at timestamptz not null default now()
);

-- Які агенції допущені до якої вакансії
create table job_agency (
  job_id uuid references jobs(id) on delete cascade,
  agency_id uuid references agencies(id) on delete cascade,
  primary key (job_id, agency_id)
);

-- ── Кандидати ───────────────────────────────────────────────────────────────
create table candidates (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  source cand_source not null default 'direct',
  position_id int references positions(id) on delete set null,  -- позиція для пошуку (з довідника)
  created_at timestamptz not null default now(),
  unique (email)                                   -- базовий захист від дублів (за потреби email+phone)
);
create index on candidates (position_id);

-- ── Заявки (кандидат ↔ вакансія) ────────────────────────────────────────────
create table applications (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id),
  candidate_id uuid not null references candidates(id) on delete cascade,
  stage app_stage not null default 'new',
  salary_expectation integer,                      -- очікувана ЗП
  salary_currency text not null default 'UAH',
  agency_id uuid references agencies(id),           -- NULL = прямий кандидат (атрибуція джерела)
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, candidate_id)                    -- один кандидат — одна заявка на вакансію
);
create index on applications (job_id);
create index on applications (candidate_id);
create index on applications (agency_id);
create index on applications (stage);

-- ── Нотатки (на заявці; видно і в профілі кандидата через candidate_id) ──────
create table notes (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  candidate_id uuid not null references candidates(id) on delete cascade,
  author_id uuid references users(id),
  text text not null,
  created_at timestamptz not null default now()
);
create index on notes (application_id);
create index on notes (candidate_id);

-- ── Файли (резюме тощо); можуть бути без заявки (загальна форма) ─────────────
create table attachments (
  id uuid primary key default gen_random_uuid(),
  candidate_id uuid not null references candidates(id) on delete cascade,
  application_id uuid references applications(id) on delete set null,  -- NULL = загальне резюме
  kind text not null default 'resume',             -- resume / cover_letter / other
  file_url text not null,
  file_name text,
  uploaded_by uuid references users(id),            -- NULL = завантажив кандидат із форми
  created_at timestamptz not null default now()
);
create index on attachments (candidate_id);
create index on attachments (application_id);

-- ── Історія етапів (для аналітики найму) ────────────────────────────────────
create table stage_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references applications(id) on delete cascade,
  from_stage app_stage,
  to_stage app_stage,
  changed_by uuid references users(id),
  changed_at timestamptz not null default now()
);

-- ============================================================================
--  Тригери
-- ============================================================================
create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger trg_applications_touch
  before update on applications
  for each row execute function public.touch_updated_at();

create or replace function public.log_stage_change() returns trigger
  language plpgsql security definer set search_path = public as $$
begin
  if (new.stage is distinct from old.stage) then
    insert into stage_history(application_id, from_stage, to_stage, changed_by)
    values (new.id, old.stage, new.stage, auth.uid());
  end if;
  return new;
end $$;

create trigger trg_applications_stage_log
  after update on applications
  for each row execute function public.log_stage_change();

-- ============================================================================
--  Хелпери авторизації (security definer, щоб уникнути рекурсії RLS)
-- ============================================================================
create or replace function public.is_hr() returns boolean
  language sql stable security definer set search_path = public as $$
  select coalesce((select role from public.users where id = auth.uid()) = 'hr', false)
$$;

create or replace function public.current_agency() returns uuid
  language sql stable security definer set search_path = public as $$
  select agency_id from public.users where id = auth.uid()
$$;

-- ============================================================================
--  RLS
-- ============================================================================
alter table agencies      enable row level security;
alter table users         enable row level security;
alter table positions     enable row level security;
alter table jobs          enable row level security;
alter table job_agency    enable row level security;
alter table candidates    enable row level security;
alter table applications  enable row level security;
alter table notes         enable row level security;
alter table attachments   enable row level security;
alter table stage_history enable row level security;

-- positions: усі читають активні (для випадайки); HR керує
create policy positions_read   on positions for select using (active or public.is_hr());
create policy positions_manage on positions for all
  using (public.is_hr()) with check (public.is_hr());

-- users: HR бачить усіх; кожен — себе
create policy users_hr   on users for all using (public.is_hr()) with check (public.is_hr());
create policy users_self on users for select using (id = auth.uid());

-- agencies: HR усе; агенція — лише свій запис
create policy agencies_hr   on agencies for all using (public.is_hr()) with check (public.is_hr());
create policy agencies_self on agencies for select using (id = public.current_agency());

-- jobs: публіка бачить open; HR усе; агенція — лише призначені їй
create policy jobs_public_read on jobs for select using (status = 'open');
create policy jobs_hr          on jobs for all using (public.is_hr()) with check (public.is_hr());
create policy jobs_agency_read on jobs for select using (
  exists (select 1 from job_agency ja
          where ja.job_id = jobs.id and ja.agency_id = public.current_agency())
);

-- job_agency: HR керує; агенція читає свої зв'язки
create policy job_agency_hr    on job_agency for all using (public.is_hr()) with check (public.is_hr());
create policy job_agency_read  on job_agency for select using (agency_id = public.current_agency());

-- candidates: HR усе; агенція — лише пов'язаних зі своїми заявками
create policy candidates_hr on candidates for all using (public.is_hr()) with check (public.is_hr());
create policy candidates_agency_read on candidates for select using (
  exists (select 1 from applications a
          where a.candidate_id = candidates.id and a.agency_id = public.current_agency())
);

-- applications: HR усе; агенція бачить свої й може створювати у дозволену вакансію
create policy applications_hr on applications for all using (public.is_hr()) with check (public.is_hr());
create policy applications_agency_read on applications for select
  using (agency_id = public.current_agency());
create policy applications_agency_insert on applications for insert with check (
  agency_id = public.current_agency()
  and stage = 'new'
  and exists (select 1 from job_agency ja
              where ja.job_id = applications.job_id and ja.agency_id = public.current_agency())
);
-- (навмисно немає update/delete для агенції — етап змінює лише HR)

-- notes: лише HR
create policy notes_hr on notes for all using (public.is_hr()) with check (public.is_hr());

-- attachments: HR усе (читати/завантажувати/видаляти); агенція — лише свої подачі
create policy attachments_hr on attachments for all using (public.is_hr()) with check (public.is_hr());
create policy attachments_agency_read on attachments for select using (
  exists (select 1 from applications a
          where a.id = attachments.application_id and a.agency_id = public.current_agency())
);

-- stage_history: читає HR
create policy stage_history_hr on stage_history for select using (public.is_hr());

-- ============================================================================
--  Сховище файлів (Supabase Storage): приватний бакет 'resumes'
--  HR — повний доступ. Публічні завантаження — через Edge Function (service key)
--  або signed upload URL. Агенції — видача через signed URL з боку застосунку.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false)
on conflict (id) do nothing;

create policy resumes_hr_all on storage.objects for all to authenticated
  using (bucket_id = 'resumes' and public.is_hr())
  with check (bucket_id = 'resumes' and public.is_hr());

-- ============================================================================
--  SEED: позиції з наявного складу «Вулика» (Employees/employees.json).
--  Одрук «Ендокинолог» виправлено на «Ендокринолог». Зайве приберете
--  на сторінці налаштувань (active = false).
-- ============================================================================
insert into positions (name, sort_order) values
  ('Адміністратор', 10),
  ('Адміністратор кол-центру', 20),
  ('Бухгалтер', 30),
  ('Гастроентеролог', 40),
  ('Дитяча отоларинголог', 50),
  ('Дитячий невролог', 60),
  ('Дитячий психотерапевт', 70),
  ('Доросла та дитяча гінеколог', 80),
  ('Доросла та дитяча отоларинголог', 90),
  ('Дорослий та дитячий хірург', 100),
  ('Ендокринолог', 110),
  ('Завідувач по господарській частині', 120),
  ('Кардіолог', 130),
  ('Керівник', 140),
  ('Медична Директор, Сімейна лікарка', 150),
  ('Медсестра', 160),
  ('Менеджер з адміністративної діяльності', 170),
  ('Операційна Директор', 180),
  ('Педіатр', 190),
  ('Практичний психолог', 200),
  ('Психіатр', 210),
  ('Сімейна Лікарка', 220),
  ('SMM-менеджер', 230),
  ('Терапевт', 240)
on conflict (name) do nothing;
