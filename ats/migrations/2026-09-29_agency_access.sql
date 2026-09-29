-- Роль agency: дозволити агенції ПОДАВАТИ кандидатів на свою вакансію.
-- Читання вже налаштоване (candidates_agency_read, applications_agency_read,
-- jobs_agency_read, attachments_agency_read). Тут додаємо вставку.
-- Застосувати: Supabase → SQL Editor → Run.

-- Агенція може створювати кандидатів (лише вставка; бачить лише пов'язаних)
drop policy if exists candidates_agency_insert on candidates;
create policy candidates_agency_insert on candidates for insert
  with check (public.current_agency() is not null);

-- Агенція може додавати вкладення до СВОЇХ заявок
drop policy if exists attachments_agency_insert on attachments;
create policy attachments_agency_insert on attachments for insert
  with check (
    public.current_agency() is not null
    and exists (select 1 from applications a
                where a.id = attachments.application_id and a.agency_id = public.current_agency())
  );

-- Сховище резюме: агенція завантажує файли та читає лише власні завантаження
drop policy if exists resumes_agency_insert on storage.objects;
create policy resumes_agency_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'resumes' and public.current_agency() is not null);

drop policy if exists resumes_agency_read on storage.objects;
create policy resumes_agency_read on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and owner = auth.uid());
