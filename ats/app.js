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

/* Легке форматування нотаток (безпечний markdown-субсет):
   **жирний**, _курсив_, `код`, [текст](https://…), списки з "- ", переноси рядків */
function renderNoteText(s) {
  const esc = escapeHtml(s);
  function inline(t) {
    return t
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/(^|[\s(])_(.+?)_(?=[\s).,!?:;]|$)/g, '$1<em>$2</em>')
      .replace(/`([^`]+?)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  }
  const lines = esc.replace(/\r/g, '').split('\n');
  const out = [];
  let list = null;
  function flush() { if (list) { out.push('<ul style="margin:4px 0; padding-left:20px">' + list + '</ul>'); list = null; } }
  lines.forEach(function (line) {
    if (/^\s*[-•]\s+/.test(line)) { list = (list || '') + '<li>' + inline(line.replace(/^\s*[-•]\s+/, '')) + '</li>'; }
    else { flush(); out.push(inline(line)); }
  });
  flush();
  return out.join('<br>').replace(/<br>(<ul)/g, '$1').replace(/(<\/ul>)<br>/g, '$1');
}

/* ===== Міні-редактор нотаток (toolbar + contenteditable), як у Slack ===== */
function injectRteStyles() {
  if (document.getElementById('rteStyles')) return;
  const st = document.createElement('style');
  st.id = 'rteStyles';
  st.textContent =
    '.rte{ border:1px solid var(--line); border-radius:9px; background:#fff; }'
  + '.rte__tb{ display:flex; gap:2px; padding:5px 6px; border-bottom:1px solid var(--line); flex-wrap:wrap; }'
  + '.rte__tb button{ background:none; border:none; cursor:pointer; min-width:28px; height:28px; border-radius:6px; color:#444; font-size:14px; line-height:1; display:inline-flex; align-items:center; justify-content:center; }'
  + '.rte__tb button:hover{ background:var(--hover); color:var(--accent-deep); }'
  + '.rte__in{ min-height:70px; max-height:260px; overflow:auto; padding:9px 12px; font:inherit; font-size:14px; outline:none; line-height:1.55; }'
  + '.rte__in:empty:before{ content:attr(data-ph); color:var(--muted); }'
  + '.rte__in ul,.rte__in ol{ margin:4px 0; padding-left:22px; }'
  + '.rte__in a{ color:var(--accent-deep); }';
  document.head.appendChild(st);
}

function sanitizeNoteHtml(html) {
  const ALLOWED = { B:1, STRONG:1, I:1, EM:1, U:1, S:1, STRIKE:1, DEL:1, A:1, UL:1, OL:1, LI:1, BR:1, P:1, DIV:1, BLOCKQUOTE:1, SPAN:1 };
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  (function walk(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (ch) {
      if (ch.nodeType === 1) {
        const tag = ch.tagName;
        if (!ALLOWED[tag]) {
          while (ch.firstChild) node.insertBefore(ch.firstChild, ch);
          node.removeChild(ch);
          return;
        }
        Array.prototype.slice.call(ch.attributes).forEach(function (a) {
          if (tag === 'A' && a.name === 'href' && /^(https?:|mailto:)/i.test(a.value)) return;
          ch.removeAttribute(a.name);
        });
        if (tag === 'A') { ch.setAttribute('target', '_blank'); ch.setAttribute('rel', 'noopener'); }
        walk(ch);
      } else if (ch.nodeType !== 3) {
        node.removeChild(ch);
      }
    });
  })(tmp);
  return tmp.innerHTML;
}

function makeRichEditor(mount, placeholder) {
  injectRteStyles();
  function b(cmd, label, title) { return '<button type="button" data-cmd="' + cmd + '" title="' + title + '">' + label + '</button>'; }
  mount.className = 'rte';
  mount.innerHTML =
    '<div class="rte__tb">'
    + b('bold', '<b>B</b>', 'Жирний')
    + b('italic', '<i>I</i>', 'Курсив')
    + b('underline', '<u>U</u>', 'Підкреслений')
    + b('strikeThrough', '<s>S</s>', 'Закреслений')
    + b('createLink', '🔗', 'Посилання')
    + b('insertOrderedList', '1.', 'Нумерований список')
    + b('insertUnorderedList', '•', 'Маркований список')
    + '</div>'
    + '<div class="rte__in" contenteditable="true" data-ph="' + (placeholder || '') + '"></div>';
  const input = mount.querySelector('.rte__in');
  mount.querySelector('.rte__tb').addEventListener('mousedown', function (e) {
    const btn = e.target.closest('button[data-cmd]'); if (!btn) return;
    e.preventDefault();
    input.focus();
    try { document.execCommand('styleWithCSS', false, false); } catch (_e) {}
    const cmd = btn.getAttribute('data-cmd');
    if (cmd === 'createLink') {
      const url = prompt('Посилання (https://…):');
      if (url) document.execCommand('createLink', false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
  });
  return {
    el: input,
    getHTML: function () { return sanitizeNoteHtml(input.innerHTML).trim(); },
    isEmpty: function () { return input.textContent.trim() === '' && !input.querySelector('li,img'); },
    setHTML: function (h) { input.innerHTML = sanitizeNoteHtml(h || ''); },
    clear: function () { input.innerHTML = ''; },
    focus: function () { input.focus(); }
  };
}
