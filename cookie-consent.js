(function () {
  'use strict';

  var STORAGE_KEY = 'vulykCookieConsent';

  function grantAnalytics() {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  }

  var saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'accepted') {
    grantAnalytics();
    return;
  }
  if (saved === 'declined') {
    return;
  }

  var banner = document.createElement('div');
  banner.id = 'cookieConsent';
  banner.className = 'cookie-consent';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Повідомлення про використання cookie-файлів');

  banner.innerHTML = [
    '<div class="cookie-consent__box">',
      '<p class="cookie-consent__text">',
        'Ми використовуємо файли cookie, щоб покращувати роботу сайту та аналізувати відвідуваність. ',
        'Продовжуючи користуватися сайтом, ви погоджуєтесь з їх використанням.',
      '</p>',
      '<div class="cookie-consent__actions">',
        '<button type="button" class="cookie-consent__btn cookie-consent__btn--decline">Відхилити</button>',
        '<button type="button" class="cookie-consent__btn cookie-consent__btn--accept">Прийняти</button>',
      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(banner);

  function close() {
    banner.classList.remove('is-visible');
    setTimeout(function () { banner.remove(); }, 300);
  }

  banner.querySelector('.cookie-consent__btn--accept').addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    grantAnalytics();
    close();
  });

  banner.querySelector('.cookie-consent__btn--decline').addEventListener('click', function () {
    localStorage.setItem(STORAGE_KEY, 'declined');
    close();
  });

  requestAnimationFrame(function () {
    banner.classList.add('is-visible');
  });
})();
