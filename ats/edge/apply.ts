// ============================================================================
//  Supabase Edge Function: apply
//  Публічний прийом заявок (talent pool + на конкретну вакансію).
//  Використовує SERVICE_ROLE ключ (лише на сервері!) — обходить RLS.
//
//  Деплой (варіант А, через Dashboard):
//    Supabase → Edge Functions → Deploy a new function → назва "apply"
//    → вставити цей код → Deploy. verify_jwt лишити увімкненим (клієнт
//    надсилає anon-ключ у заголовку Authorization).
//
//  Деплой (варіант Б, CLI):
//    покласти файл у supabase/functions/apply/index.ts, тоді
//    supabase functions deploy apply
//
//  SUPABASE_URL та SUPABASE_SERVICE_ROLE_KEY додаються Supabase автоматично.
//  Приймає multipart/form-data з полями:
//    full_name*, email|phone*, phone, job_id, position_id,
//    salary_expectation, message, resume (файл)
// ============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return json({ error: 'Server not configured' }, 500);
  const admin = createClient(url, serviceKey);

  try {
    const form = await req.formData();
    const str = (k: string) => (form.get(k) ?? '').toString().trim();

    const fullName = str('full_name');
    const email = str('email').toLowerCase();
    const phone = str('phone');
    const jobId = str('job_id');
    const positionId = str('position_id');
    const salary = str('salary_expectation');
    const message = str('message');
    const file = form.get('resume');

    if (!fullName) return json({ error: 'Вкажіть імʼя' }, 400);
    if (!email && !phone) return json({ error: 'Вкажіть email або телефон' }, 400);

    // 1) знайти або створити кандидата (дедуп за email)
    let candidate: any = null;
    if (email) {
      const { data } = await admin.from('candidates').select('*').eq('email', email).maybeSingle();
      candidate = data;
    }
    if (!candidate) {
      const { data, error } = await admin.from('candidates').insert({
        full_name: fullName,
        email: email || null,
        phone: phone || null,
        source: 'direct',
        position_id: positionId ? Number(positionId) : null,
        summary: (!jobId && message) ? message : null,
      }).select('*').single();
      if (error) throw error;
      candidate = data;
    } else {
      // доповнити порожні поля наявного профілю
      const patch: Record<string, unknown> = {};
      if (!candidate.phone && phone) patch.phone = phone;
      if (!candidate.position_id && positionId) patch.position_id = Number(positionId);
      if (!candidate.summary && !jobId && message) patch.summary = message;
      if (Object.keys(patch).length) await admin.from('candidates').update(patch).eq('id', candidate.id);
    }

    // 2) заявка на вакансію (лише якщо вакансія відкрита)
    let applicationId: string | null = null;
    if (jobId) {
      const { data: job } = await admin.from('jobs').select('id,status').eq('id', jobId).maybeSingle();
      if (!job || job.status !== 'open') return json({ error: 'Вакансію не знайдено або вона закрита' }, 400);

      const { data: existingApp } = await admin.from('applications')
        .select('id').eq('job_id', jobId).eq('candidate_id', candidate.id).maybeSingle();
      if (existingApp) {
        applicationId = existingApp.id;
      } else {
        const { data: app, error: appErr } = await admin.from('applications').insert({
          job_id: jobId,
          candidate_id: candidate.id,
          stage: 'new',
          salary_expectation: salary ? Number(salary) : null,
        }).select('id').single();
        if (appErr) throw appErr;
        applicationId = app.id;
      }

      // супровідний лист → нотатка на заявці
      if (message) {
        await admin.from('notes').insert({
          application_id: applicationId,
          candidate_id: candidate.id,
          text: 'Із форми подачі: ' + message,
        });
      }
    }

    // 3) файл резюме
    if (file && typeof file !== 'string' && (file as File).size > 0) {
      const f = file as File;
      const safe = f.name.replace(/[^\w.\-]+/g, '_');
      const path = candidate.id + '/' + Date.now() + '_' + safe;
      const up = await admin.storage.from('resumes').upload(path, f, {
        contentType: f.type || 'application/octet-stream',
        upsert: false,
      });
      if (!up.error) {
        await admin.from('attachments').insert({
          candidate_id: candidate.id,
          application_id: applicationId,
          kind: 'resume',
          file_url: path,
          file_name: f.name,
        });
      }
    }

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});
