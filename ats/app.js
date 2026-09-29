/* ATS «Вулик» — спільний шар: конфіг, клієнт, авторизація, навігація */

/* ===================== CONFIG ===================== */
const SB_URL  = 'https://lrahraibulpaagpwyvzj.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYWhyYWlidWxwYWFncHd5dnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzMyNDcsImV4cCI6MjEwNTkwOTI0N30.BC0fPTDip2jabAHcSCkSiCEh--fsG7Bin7xiEoi1L-Y';
/* ================================================== */

const sb = supabase.createClient(SB_URL, SB_ANON);
const ATS = { user: null, me: null };

function el(id) { return document.getElementById(id); }

/* Верхня панель із навігацією (HR) */
function renderTop(active) {
  const links = [
    { href: 'jobs.html',     label: 'Вакансії' },
    { href: 'candidates.html', label: 'Кандидати' },
    { href: 'agencies.html', label: 'Агенції' },
    { href: 'settings.html', label: 'Налаштування' }
  ];
  const nav = links.map(function (l) {
    const cur = l.href === active ? ' class="active"' : '';
    return '<a href="' + l.href + '"' + cur + '>' + l.label + '</a>';
  }).join('');
  return ''
    + '<div class="top">'
    +   '<div style="display:flex;align-items:center;gap:20px">'
    +     '<a href="stats.html" class="top__brand" style="text-decoration:none;color:inherit" title="Аналітика"><img src="../Вулик-лого.png" alt="Вулик" class="top__logo"> Applicant Tracking System</a>'
    +     '<nav class="nav">' + nav + '</nav>'
    +   '</div>'
    +   '<div class="top__right">'
    +     '<span class="top__who" id="atsWho"></span>'
    +     '<button class="btn btn--ghost btn--sm" id="atsLogout">Вийти</button>'
    +   '</div>'
    + '</div>';
}

/* Верхня панель для агенції (без HR-навігації) */
function renderTopAgency(agencyName) {
  return ''
    + '<div class="top">'
    +   '<div style="display:flex;align-items:center;gap:14px">'
    +     '<div class="top__brand"><img src="../Вулик-лого.png" alt="Вулик" class="top__logo"> Кабінет агенції</div>'
    +     (agencyName ? '<span class="top__who">' + escapeHtml(agencyName) + '</span>' : '')
    +   '</div>'
    +   '<div class="top__right">'
    +     '<span class="top__who" id="atsWho"></span>'
    +     '<button class="btn btn--ghost btn--sm" id="atsLogout">Вийти</button>'
    +   '</div>'
    + '</div>';
}

async function atsLogout() { await sb.auth.signOut(); location.href = 'login.html'; }

/* Захист сторінки: вимагає входу + ролі hr, тоді викликає pageInit() */
async function atsGuard(activePage, pageInit) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'login.html'; return; }
  ATS.user = session.user;

  // шапка
  const mount = el('top');
  if (mount) mount.innerHTML = renderTop(activePage);
  const who = el('atsWho'); if (who) who.textContent = session.user.email;
  const lo = el('atsLogout'); if (lo) lo.addEventListener('click', atsLogout);

  // роль
  const { data: me } = await sb.from('users').select('role,full_name,agency_id').eq('id', session.user.id).maybeSingle();
  ATS.me = me;
  if (me && me.role === 'agency') { location.href = 'agency.html'; return; }
  if (!me || me.role !== 'hr') {
    const na = el('noAccess'); if (na) na.hidden = false;
    return;
  }
  const na = el('noAccess'); if (na) na.hidden = true;
  if (typeof pageInit === 'function') pageInit();
}

/* Захист сторінки агенції: вимагає ролі agency */
async function agencyGuard(pageInit) {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { location.href = 'login.html'; return; }
  ATS.user = session.user;

  const { data: me } = await sb.from('users').select('role,full_name,agency_id').eq('id', session.user.id).maybeSingle();
  ATS.me = me;
  if (me && me.role === 'hr') { location.href = 'jobs.html'; return; }
  if (!me || me.role !== 'agency' || !me.agency_id) {
    const na = el('noAccess'); if (na) na.hidden = false;
    const mount = el('top'); if (mount) mount.innerHTML = renderTopAgency('');
    const lo = el('atsLogout'); if (lo) lo.addEventListener('click', atsLogout);
    return;
  }

  // назва агенції для шапки
  let agencyName = '';
  const { data: ag } = await sb.from('agencies').select('name').eq('id', me.agency_id).maybeSingle();
  if (ag) agencyName = ag.name;

  const mount = el('top');
  if (mount) mount.innerHTML = renderTopAgency(agencyName);
  const who = el('atsWho'); if (who) who.textContent = session.user.email;
  const lo = el('atsLogout'); if (lo) lo.addEventListener('click', atsLogout);

  if (typeof pageInit === 'function') pageInit();
}

/* Хелпер повідомлень */
function flash(node, text, ok) {
  node.className = 'msg' + (ok ? ' msg--ok' : ' msg--err');
  node.textContent = text;
  if (text) setTimeout(function () { if (node.textContent === text) node.textContent = ''; }, 2600);
}

function escapeHtml(s) {
  return (s == null ? '' : ('' + s)).replace(/[&<>"]/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
  });
}
