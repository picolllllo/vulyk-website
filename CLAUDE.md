# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the site locally

```bash
python -m http.server 3000
```

The dev server is pre-configured in `.claude/launch.json` — use the `preview_start` tool with server name `vulyk-clinic`. The site is then accessible at `http://localhost:3000`.

## Architecture overview

This is a **pure static HTML/CSS/JS** website with no build system, no bundler, and no framework. Every page is a standalone `.html` file.

### Shared resources loaded on every page
- `styles.css` — all global styles (CSS custom properties, header, footer, nav, cards, scroll-reveal, booking modal). Page-specific styles live in `<style>` blocks inside each HTML file.
- `nav.js` — mobile menu toggle, transparent header on scroll (only on `index.html` which has `.hero-vid`), and the **global scroll-reveal** system (adds `.reveal` class + `IntersectionObserver` → `.is-visible`).
- `booking-modal.js` — injects the appointment modal into `<body>` and intercepts every click on elements whose text starts with `Записатис`.
- `carousel.js` — generic carousel for `.carousel` / `.carousel__track` / `.carousel__slide` patterns (used on index hero).

### CSS design tokens (`:root` in `styles.css`)
| Variable | Value |
|---|---|
| `--primary` | `#2B4B3E` (dark green) |
| `--accent` | `#E8A820` (amber) |
| `--accent-deep` | `#C8900A` |
| `--warm-bg` | `#fffef9` |
| `--max-w` | `1400px` |
| `--pad` | `48px` |
| `--header-h` | `64px` |

### Scroll-reveal pattern
Elements that should animate in on scroll: add class `reveal` in CSS/JS (gives `opacity:0; translateY(32px)`). `nav.js` observes a fixed selector list and adds `.is-visible` via `IntersectionObserver`. For sections not in that list, add a standalone `IntersectionObserver` inline in the page (see logo-cloud or reviews section in `index.html` for examples with staggered `transition-delay`).

### Page naming conventions
| Pattern | Content |
|---|---|
| `index.html` | Home page |
| `about.html`, `team.html`, `prices.html`, `blog.html`, `vacancies.html` | Top-level pages |
| `dir-*.html` | Medical direction landing pages (e.g. `dir-uzi.html`) |
| `sub-*.html` | Sub-service detail pages (e.g. `sub-pediatriya.html`) |
| `team-*.html` | Individual doctor profile pages |
| `location-*.html` | Clinic location pages |
| `news-*.html` | News/blog article pages |
| `vacancy-*.html` | Individual vacancy pages |

### Key data files
- `Employees/employees.json` — array of `{ first, last, designation, email }` objects for all staff.
- `Employees/*.avif` — staff portrait photos, named `Прізвище Ім'я.avif`.
- `Reviews/*.png` — screenshots of Google reviews (images, not text).

### index.html structure (top → bottom)
Header → Hero (video + carousel) → Founder quote section → Team carousel → Directions grid → Partners logo cloud → **Reviews carousel** → Blog preview → Footer

The reviews carousel uses an infinite-clone technique: 5 clones of the last items prepended, 5 clones of the first items appended (19 DOM slots total for 9 reviews). `CLONE = 5`. Forward wrap: `current === N + CLONE → jump to CLONE`. Backward wrap: `current === 0 → jump to N`.

### about.html timeline
Uses a scroll-driven animated timeline (`.acet-tl`). The fill bar height is driven by `window.scrollY` relative to the section bounds; dots and year numbers activate when their dot enters 60% of the viewport.
