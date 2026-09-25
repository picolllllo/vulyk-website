/* ATS «Вулик» — спільний шар: конфіг, клієнт, авторизація, навігація */

/* ===================== CONFIG ===================== */
const SB_URL  = 'https://lrahraibulpaagpwyvzj.supabase.co';
const SB_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxyYWhyYWlidWxwYWFncHd5dnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAzMzMyNDcsImV4cCI6MjEwNTkwOTI0N30.BC0fPTDip2jabAHcSCkSiCEh--fsG7Bin7xiEoi1L-Y';
/* ================================================== */

const sb = supabase.createClient(SB_URL, SB_ANON);
const ATS = { user: null, me: null };

function el(id) { return document.getElementById(id); }

/* Верхня панель із навігацією */
function renderTop(active) {
  const links = [
    { href: 'jobs.html',     label: 'Вакансії' },
    { href: 'candidates.html', label: 'Кандидати' },
    { href: 'settings.html', label: 'Налаштування' }
  ];
  const nav = links.map(function (l) {
    const cur = l.href === active ? ' class="active"' : '';
    return '<a href="' + l.href + '"' + cur + '>' + l.label + '</a>';
  }).join('');
  return ''
    + '<div class="top">'
    +   '<div style="display:flex;align-items:center;gap:20px">'
    +     '<div class="top__brand"><img src="../Вулик-лого.png" alt="Вулик" class="top__logo"> Applicant Tracking System</div>'
    +     '<nav class="nav">' + nav + '</nav>'
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
  const { data: me } = await sb.from('users').select('role,full_name').eq('id', session.user.id).maybeSingle();
  ATS.me = me;
  if (!me || me.role !== 'hr') {
    const na = el('noAccess'); if (na) na.hidden = false;
    return;
  }
  const na = el('noAccess'); if (na) na.hidden = true;
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
