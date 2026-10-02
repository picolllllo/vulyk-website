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

/* Відображення збереженого тексту: новий формат — HTML (з редактора),
   старий — легкий markdown-субсет. Автовизначення за наявністю тегів. */
function hasHtmlMarkup(s) { return /<[a-z][\s\S]*>/i.test(s || ''); }
function renderStoredNote(s) { return hasHtmlMarkup(s) ? sanitizeNoteHtml(s) : renderNoteText(s); }

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

/* ===== Єдиний довідник навичок + автопідказка ===== */
const ATS_SKILLS = ['1С:Бухгалтерія','ABBYY FineReader','Adobe Photoshop','AutoCAD','BAS Бухгалтерія','Binotel','Cash Flow','Chat GPT','CorelDRAW','CRM','Doctor Eleks','eHealth','ERP','Google Docs','Google Sheets','Health24','Helsi','IS-pro','M.E.Doc','MedEir','MS Access','MS Excel','MS Office','MS Outlook','MS PowerPoint','MS Word','OpenCart','P&L','SAP','TeamViewer','Адаптивність','Адміністративне управління','Адміністрування','Адміністрування клініки','Адміністрування офісу','Адміністрування стоматології','Акуратність','Акушерство','Амбулаторний прийом','Аналіз продажів','Аналітика інформації','Англійська (B1)','Англійська (B2)','Англійська (Elementary)','Англійська (базовий)','Англійська (вище середнього)','Англійська (вільно)','Англійська (середній)','Анестезіологія','Анестезія','Апаратна косметологія','Апаратний масаж','Асептика та антисептика','Асистування лікарю','Бухгалтерський облік','Бюджетування','Вакцинація','Ввічливість','Ведення бази пацієнтів','Ведення документації','Ведення медичної документації','Ведення переговорів','Ведення соцмереж','Ведення табелю робочого часу','Виконання масажу','Виконання призначень лікаря','Вирішення конфліктних ситуацій','Висока працездатність','Внутрішньовенні ін’єкції','Внутрішньом’язові ін’єкції','Водійські права категорії B','Відповідальність','Господарське право','Грамотна усна та письмова мова','Графічні редактори','Гінекологічне УЗД','Делегування завдань','Дисциплінованість','Дитяче УЗД','Дитячий масаж','Доброзичливість','Догляд за онкохворими','Догляд за пацієнтами','Договірні відносини','Дільнична медсестра','ЕКГ','Еластометрія печінки','Емпатія','Ендокринологія','Ерготерапія','Ефективне управління часом','Ехокардіографія','Забір венозної крові','Забір мазків','Завзятість','Загальний масаж','Запис на прийом','Заповнення карток товарів на OLX','Заповнення карток товарів на Prom','Заповнення карток товарів на Rozetka','Звітність ЄСВ','Здатність до навчання','ЗЕД','Знання законодавства','Кадровий облік','Касові операції','Катетеризація','Клієнт-Банк','Клієнтоорієнтованість','Клієнтський сервіс','Комерційні пропозиції','Комп’ютерна томографія (КТ)','Комунікабельність','Комунікація з пацієнтами','Консультація клієнтів','Консультування пацієнтів','Контроль дебіторської заборгованості','Контроль залишків','Контроль лікувального процесу','Контроль медобладнання','Контроль цінників','Контроль якості продукції','Конфіденційність','Координація відділів','Користувач Internet','Користувач ПК','КТГ','Лідерство','Лідерські якості','Лікувальний масаж','Маркетингова стратегія','Медичний переклад (англійська)','Медичні знання','Медогляди','Медсестра в стоматології','Менеджмент медсестринства','Навчання та розвиток персоналу','Написання рекламних текстів','Наполегливість','Нарахування заробітної плати','Наставництво','Неконфліктність','Німецька (B2)','Облік клієнтів','Облік медикаментів','Облік основних засобів','Облік ПДВ','Облік ТМЦ','Облік товару','Оборотно-сальдові відомості','Обробка документів','Озонотерапія','Оперативність','Оператор call-центру','Операційна медсестра','Операційний менеджмент','Оптимізація оподаткування','Організація графіка лікарів','Організація охорони здоров’я','Організація роботи','Організація роботи бухгалтерії','Організація роботи персоналу','Організованість','Основи косметології','Охайність','Оцінювання персоналу','Паліативна допомога','Педіатрія','Первинна документація','Перевірка документів','Перевірка за кресленнями','Перев’язка ран','Перша медична допомога','Планування','Планування графіків','Планування продажів','Планування часу','Податкова звітність','Податковий облік','Поліклінічна медсестра','Постановка крапельниці','Постова медична сестра','Працьовитість','Привітність','Прийняття рішень','Прийняття стратегічних рішень','Прийом вхідних дзвінків','Проведення медичних процедур','Проведення тренінгів','Проведення ін’єкцій','Продаж фінансових послуг','Продажі','Продуктивність','Профілактичні заходи','Пунктуальність','Підбір кадрів','Підбір та управління персоналом','Підготовка пацієнтів до обстежень','Підготовка робочого місця лікаря','Підшкірні ін’єкції','Пілінг','Післяопераційний догляд','Редагування текстів','Рекрутмент','Реєстрація пацієнтів','Реєстрація податкових накладних','Робота в багатозадачності','Робота в команді','Робота в стресових ситуаціях','Робота з базами даних','Робота з договорами','Робота з документацією','Робота з запереченнями','Робота з клієнтами','Робота з людьми','Робота з нормативними актами','Робота з пацієнтами','Робота з постачальниками','Робота касира','Робота медичного реєстратора','Робота рентгенолаборанта','Робота із запереченнями','Розв’язання конфліктів','РРО CheckBox','Саморозвиток','Самостійність','Санітарно-гігієнічні норми','Сестринська справа','Складання рахунків','Спостереження за станом пацієнтів','Старанність','Стратегічне планування','Стресостійкість','Стриманість','Судова практика','Сумлінність','Супровід пацієнта під час процедур','Сімейна медицина','Сімейна медсестра','Табель обліку робочого часу','Тактовність','Творчість у розв’язанні проблем','Телемедицина','Терапія','Точність','Транспортування постраждалих','Трудове законодавство','Уважність','УЗД апендиксу','УЗД легень','УЗД лімфатичних вузлів','УЗД молочних залоз','УЗД м’яких тканин','УЗД нирок','УЗД органів черевної порожнини','УЗД судин','УЗД щитоподібної залози','Укладання документів','Ультразвукова діагностика','Уміння слухати','Управління командою','Управління конфліктами','Управління магазином','Управління персоналом','Управління продажами','Управління часом','Управлінський облік','Урогенітальні забори','Урологічне УЗД','Фармація','Фельдшерська справа','Формування звітів','Фінансова документація','Фінансова звітність','Фінансове законодавство','Фінансове планування','Фінансовий аналіз','Фінансовий менеджмент','Хоспісна допомога','Цивільне право','Чесність','Чистка обличчя','Швидкий набір тексту','Інвентаризація','Інтенсивна терапія новонароджених','Ініціативність'];

function injectSkillsDatalist() {
  if (document.getElementById('atsSkills')) return;
  const dl = document.createElement('datalist');
  dl.id = 'atsSkills';
  dl.innerHTML = ATS_SKILLS.map(function (s) { return '<option value="' + escapeHtml(s) + '">'; }).join('');
  document.body.appendChild(dl);
}

function injectTagStyles() {
  if (document.getElementById('tagStyles')) return;
  const st = document.createElement('style');
  st.id = 'tagStyles';
  st.textContent =
    '.tagbox{ display:flex; flex-wrap:wrap; gap:6px; align-items:center; border:1px solid var(--line); border-radius:9px; padding:7px 9px; background:#fff; }'
  + '.tagbox .tag{ display:inline-flex; align-items:center; gap:7px; background:var(--head); border:1px solid var(--line); border-radius:7px; padding:3px 9px; font-size:13px; }'
  + '.tagbox .tag button{ background:none; border:none; cursor:pointer; color:var(--muted); font-weight:800; line-height:1; padding:0; }'
  + '.tagbox .tag button:hover{ color:var(--red); }'
  + '.tagbox .tag-in{ border:none; outline:none; font:inherit; font-size:13px; min-width:130px; flex:1; background:transparent; padding:2px; }';
  document.head.appendChild(st);
}

/* Поле-теги навичок з автопідказкою (datalist). Повертає getSkills/setSkills. */
function makeSkillTags(mount, initial) {
  injectSkillsDatalist(); injectTagStyles();
  mount.className = 'tagbox';
  let skills = (initial || []).slice();
  function add(v) {
    v = (v || '').trim().replace(/,+$/, '').trim();
    if (!v) return;
    if (skills.some(function (s) { return s.toLowerCase() === v.toLowerCase(); })) return;
    skills.push(v); render(true);
  }
  function render(focus) {
    mount.innerHTML = skills.map(function (s, i) {
      return '<span class="tag">' + escapeHtml(s) + '<button type="button" data-i="' + i + '" title="Прибрати">✕</button></span>';
    }).join('') + '<input class="tag-in" type="text" list="atsSkills" placeholder="+ навичка">';
    const inp = mount.querySelector('.tag-in');
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add(inp.value); inp.value = ''; }
      else if (e.key === 'Backspace' && inp.value === '' && skills.length) { skills.pop(); render(true); }
    });
    inp.addEventListener('change', function () { if (inp.value) { add(inp.value); inp.value = ''; } });
    if (focus) inp.focus();
  }
  mount.addEventListener('click', function (e) {
    const b = e.target.closest('button[data-i]'); if (!b) return;
    skills.splice(Number(b.dataset.i), 1); render(false);
  });
  render(false);
  return {
    getSkills: function () { return skills.slice(); },
    setSkills: function (a) { skills = (a || []).slice(); render(false); }
  };
}
