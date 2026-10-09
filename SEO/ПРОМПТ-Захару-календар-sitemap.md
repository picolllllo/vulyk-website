# Задача Захару: додати сторінку «Календар щеплень» у sitemap

Нова сторінка `sub-vaktsinatsiya-kalendar` **відсутня в `sitemap.xml`** — через це Google повільніше її знаходить.

## Що зробити
1. Додати в `sitemap.xml` рядок (за тим самим форматом, що й сусідні `sub-vaktsinatsiya*`, з `.html`):

```xml
<url>
  <loc>https://www.vulyk.clinic/sub-vaktsinatsiya-kalendar.html</loc>
  <lastmod>2026-10-09</lastmod>
  <changefreq>monthly</changefreq>
  <priority>0.7</priority>
</url>
```
*(теги lastmod/changefreq/priority — за наявним шаблоном інших sub-сторінок у цьому sitemap.)*

2. Оновити коментар-лічильник у шапці sitemap, якщо він там є (зараз написано «65», а URL-ів ~75 — привести у відповідність).

## Перевірка
- У `sitemap.xml` є `https://www.vulyk.clinic/sub-vaktsinatsiya-kalendar.html`.
- Сторінка відкривається (200), canonical/title/meta вже на місці — більше нічого чіпати не треба.

## Після впровадження (робить власник у GSC)
- Google Search Console → **Перевірка URL** для `https://www.vulyk.clinic/sub-vaktsinatsiya-kalendar` → **Запросити індексування** (прискорить появу в пошуку).

---
*Примітка (не для цієї задачі): canonical усіх сторінок сайту вказує на версію з `.html`, яка 308-редиректить на версію без `.html`. Це системний нюанс по всьому сайту, не по цій сторінці. Узгодження canonical = sitemap = фінальний URL — окрема майбутня задача на всі ~75 сторінок.*
