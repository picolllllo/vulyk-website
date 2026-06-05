(function () {
  var toggle = document.getElementById('navToggle');
  var nav    = document.querySelector('.nav');
  if (!toggle || !nav) return;

  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('.icon-open').style.display  = open ? 'none'  : 'block';
    toggle.querySelector('.icon-close').style.display = open ? 'block' : 'none';
  });

  /* close menu when a link is tapped */
  nav.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () {
      nav.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.querySelector('.icon-open').style.display  = 'block';
      toggle.querySelector('.icon-close').style.display = 'none';
    });
  });
})();

/* ── Transparent header ── */
(function () {
  var header  = document.querySelector('.header');
  var heroVid = document.querySelector('.hero-vid');
  if (!header || !heroVid) return;

  header.classList.add('header--transparent');

  function update() {
    var scrollY    = window.scrollY;
    var threshold  = heroVid.offsetHeight * 0.5;

    if (scrollY > threshold) {
      header.classList.add('header--hidden');
      header.classList.remove('header--transparent');
    } else if (scrollY > 10) {
      header.classList.remove('header--hidden');
      header.classList.remove('header--transparent');
    } else {
      header.classList.remove('header--hidden');
      header.classList.add('header--transparent');
    }
  }

  window.addEventListener('scroll', update, { passive: true });

  /* hover: тимчасово показати білий */
  header.addEventListener('mouseenter', function () {
    header.classList.remove('header--transparent');
    header.classList.remove('header--hidden');
  });
  header.addEventListener('mouseleave', update);
})();

/* ── Scroll reveal ── */
(function () {
  var SELECTOR = [
    '.hero-vid__content',
    '.fq__intro',
    '.fq__photo',
    '.fq__body',
    '.hero',
    '.doctors-section',
    '.team-count',
    '.locations__card',
    '.locations__map',
    '.blog-card',
    '.blog-main__heading',
    '.blog-main__sub',
    '.blog-filter',
    '.price-section',
    '.decl-block',
    '.vacancy-row',
    '.vac-hero',
    '.vac-apply',
    '.news-article__cover',
    '.news-article__body',
    '.news-article__video',
    '.news-article__cta'
  ].join(',');

  var els = document.querySelectorAll(SELECTOR);
  if (!els.length) return;

  /* stagger sibling cards */
  els.forEach(function (el, i) {
    el.classList.add('reveal');
    var siblings = el.parentElement ? el.parentElement.querySelectorAll('.reveal') : [];
    var idx = Array.prototype.indexOf.call(siblings, el);
    if (idx > 0) el.style.transitionDelay = (idx * 80) + 'ms';
  });

  if (!('IntersectionObserver' in window)) {
    els.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  els.forEach(function (el) { obs.observe(el); });

  /* ── Team page: animate row by row ── */
  var teamGrid = document.querySelector('.team-grid');
  if (teamGrid) {
    var tcards = Array.prototype.slice.call(teamGrid.querySelectorAll('.team-card'));
    tcards.forEach(function (c) { c.classList.add('reveal'); });

    function revealTeamRows() {
      /* group cards by visual row using their offsetTop */
      var groups = [], tops = {};
      tcards.forEach(function (c) {
        var key = Math.round(c.offsetTop / 10) * 10;
        if (!tops[key]) { tops[key] = []; groups.push(tops[key]); }
        tops[key].push(c);
      });
      groups.forEach(function (row, ri) {
        setTimeout(function () {
          row.forEach(function (c) { c.classList.add('is-visible'); });
        }, ri * 180);
      });
    }

    var tObs = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) { revealTeamRows(); tObs.disconnect(); }
    }, { threshold: 0.05 });
    tObs.observe(teamGrid);
  }
})();
