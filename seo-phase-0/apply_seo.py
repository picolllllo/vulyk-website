# -*- coding: utf-8 -*-
import glob, re, json, os

os.chdir(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

SITE = "https://www.vulyk.clinic"

# ---------- helpers ----------
def get_title_text(c):
    m = re.search(r'<title>([^<]*)</title>', c)
    return m.group(1) if m else ''

def set_head_tags(fname, c, title, desc, og_image=None):
    if og_image is None:
        og_image = f"{SITE}/assets/og-default.jpg"
    url = f"{SITE}/{fname}" if fname != 'index.html' else f"{SITE}/"

    # 1. replace <title>
    c = re.sub(r'<title>[^<]*</title>', f'<title>{title}</title>', c, count=1)

    # 2. remove any previously-inserted seo block (idempotent re-run)
    c = re.sub(r'\n?  <!-- SEO meta -->.*?<!-- /SEO meta -->\n?', '', c, flags=re.S)

    block = (
        '\n  <!-- SEO meta -->\n'
        f'  <meta name="description" content="{desc}">\n'
        f'  <link rel="canonical" href="{url}">\n'
        '  <meta property="og:type" content="website">\n'
        '  <meta property="og:site_name" content="Вулик — сімейна амбулаторія">\n'
        '  <meta property="og:locale" content="uk_UA">\n'
        f'  <meta property="og:title" content="{title}">\n'
        f'  <meta property="og:description" content="{desc}">\n'
        f'  <meta property="og:url" content="{url}">\n'
        f'  <meta property="og:image" content="{og_image}">\n'
        '  <meta name="twitter:card" content="summary_large_image">\n'
        '  <!-- /SEO meta -->\n'
    )

    # insert right after the <title> line
    c = re.sub(r'(<title>[^<]*</title>\n)', r'\1' + block, c, count=1)
    return c

def truncate(s, n):
    return s if len(s) <= n else s[:n-1].rsplit(' ', 1)[0] + '…'

# ---------- per-category description builders ----------

def team_meta(fname, c):
    name_m = re.search(r'<h1 class="doc-info__name">(.*?)</h1>', c, re.S)
    role_m = re.search(r'<span class="doc-tag">([^<]*)</span>', c)
    name = re.sub(r'<br\s*/?>', ' ', name_m.group(1)).strip() if name_m else get_title_text(c).replace(' — Вулик', '')
    role = role_m.group(1).strip() if role_m else 'спеціаліст'
    title = f"{name} — {role} у Львові — Вулик"
    desc = f"{name} — {role.lower()} амбулаторії «Вулик» у Львові. Стрийська 86В та Тичини 21. Запис на прийом онлайн у Telegram/Viber."
    return truncate(title, 60), truncate(desc, 160)

def vacancy_meta(fname, c):
    base = get_title_text(c).split(' — Вакансії')[0].strip()
    title = f"Вакансія: {base} — Вулик, Львів"
    desc = f"Амбулаторія «Вулик» у Львові шукає {base.lower()}. Умови роботи, вимоги та контакти для відгуку на вакансію."
    return truncate(title, 60), truncate(desc, 160)

def news_meta(fname, blog_index):
    entry = next((e for e in blog_index if e['url'] == fname), None)
    if not entry:
        return None
    title = f"{entry['title']} — Вулик"
    return truncate(title, 65), truncate(entry['desc'], 160)

def sub_meta(fname, c):
    base = get_title_text(c).replace(' — Вулик', '').strip()
    title = f"{base} у Львові — Вулик"
    desc = f"{base} у Львові в амбулаторії «Вулик»: досвідчені лікарі, сучасне обладнання. Партнер НСЗУ. Запис на прийом онлайн у месенджері."
    return truncate(title, 60), truncate(desc, 160)

def dir_meta(fname, c):
    base = get_title_text(c).replace(' — Вулик', '').strip()
    title = f"{base} у Львові — Вулик"
    desc = f"{base} у Львові в амбулаторії «Вулик»: повний перелік послуг напряму, досвідчені спеціалісти. Запис онлайн у Telegram/Viber."
    return truncate(title, 60), truncate(desc, 160)

def location_meta(fname, c):
    addr_m = re.search(r'<title>([^<]*)</title>', c)
    addr = addr_m.group(1).replace(' — Вулик', '').strip()
    title = f"Амбулаторія на {addr}, Львів — Вулик"
    desc = f"Сімейна амбулаторія «Вулик» на {addr} у Львові: педіатрія, сімейна медицина, вузькі спеціалісти, УЗД. Графік роботи, контакти, запис онлайн."
    return truncate(title, 60), truncate(desc, 160)

# ---------- static overrides (Priority-1 examples from README + key pages) ----------
STATIC = {
    'index.html': (
        "Вулик — сімейна амбулаторія у Львові | педіатрія, УЗД, сімейний лікар",
        "Сімейна амбулаторія «Вулик» у Львові: педіатрія, сімейний лікар, УЗД, вузькі спеціалісти. Доказова медицина, партнер НСЗУ. Запис у Telegram/Viber."
    ),
    'sub-pediatriya.html': (
        "Дитячий лікар (педіатр) у Львові — Вулик",
        "Дитячий лікар у Львові в амбулаторії «Вулик»: огляди, щеплення, супровід розвитку дитини. Досвідчені педіатри, запис онлайн. Стрийська 86В, Тичини 21."
    ),
    'sub-simeyna-med.html': (
        "Сімейний лікар у Львові — Вулик",
        "Сімейний лікар у Львові: декларація з НСЗУ безоплатно, профогляди, ведення хронічних станів. Амбулаторія «Вулик» — доказова медицина. Записатися."
    ),
    'dir-uzi.html': (
        "УЗД у Львові — Вулик",
        "УЗД у Львові для дітей, вагітних і дорослих в амбулаторії «Вулик»: серце, щитоподібна, органи, суглоби. Сучасне обладнання. Запис у месенджері."
    ),
    'sub-casd.html': (
        "Діагностика CASD (аутизм) у Львові — Вулик",
        "Діагностика розладів аутистичного спектру (CASD) у дітей 1–17 років у Львові. Амбулаторія «Вулик»: точний скринінг, дитячий психіатр. Записатися."
    ),
    'prices.html': (
        "Ціни на послуги у Львові — Вулик",
        "Ціни на послуги амбулаторії «Вулик» у Львові: консультації лікарів, УЗД, аналізи, діагностика. Актуальний прайс. Багато послуг — безоплатно за НСЗУ."
    ),
    'about.html': (
        "Про нас — амбулаторія Вулик у Львові",
        "Історія та цінності сімейної амбулаторії «Вулик» у Львові: команда лікарів, підхід до медицини, шлях розвитку клініки з 2019 року."
    ),
    'team.html': (
        "Команда лікарів — Вулик, Львів",
        "Команда лікарів амбулаторії «Вулик» у Львові: сімейні лікарі, педіатри, вузькі спеціалісти. Досвід, освіта та напрямки прийому кожного лікаря."
    ),
    'blog.html': (
        "Блог та новини — Вулик, Львів",
        "Новини, статті та поради від лікарів амбулаторії «Вулик» у Львові: профілактика, педіатрія, психічне здоров'я та інші теми здоров'я."
    ),
    'vacancies.html': (
        "Вакансії — Вулик, Львів",
        "Актуальні вакансії в амбулаторії «Вулик» у Львові: лікарі, медсестри та адміністративний персонал. Умови роботи та контакти для відгуку."
    ),
    'contacts.html': (
        "Контакти — Вулик, Львів",
        "Контакти амбулаторії «Вулик» у Львові: адреси філій на Стрийській та Тичини, телефон, месенджери для запису, графік роботи."
    ),
    '404.html': None,  # already has its own meta, skip
}

def main():
    blog_index = json.load(open('blog-index.json', encoding='utf-8'))
    files = sorted(glob.glob('*.html'))
    files = [f for f in files if f not in ('_backup-dirs-section.html',)]

    updated = []
    for fname in files:
        c = open(fname, encoding='utf-8').read()

        if fname in STATIC:
            if STATIC[fname] is None:
                continue
            title, desc = STATIC[fname]
        elif fname.startswith('team-'):
            title, desc = team_meta(fname, c)
        elif fname.startswith('vacancy-'):
            title, desc = vacancy_meta(fname, c)
        elif fname.startswith('news-'):
            res = news_meta(fname, blog_index)
            if not res:
                continue
            title, desc = res
        elif fname.startswith('location-'):
            title, desc = location_meta(fname, c)
        elif fname.startswith('dir-'):
            title, desc = dir_meta(fname, c)
        elif fname.startswith('sub-'):
            title, desc = sub_meta(fname, c)
        else:
            continue

        new_c = set_head_tags(fname, c, title, desc)
        if new_c != c:
            open(fname, 'w', encoding='utf-8', newline='').write(new_c)
            updated.append(fname)

    print(f"Updated {len(updated)} files")

if __name__ == '__main__':
    main()
