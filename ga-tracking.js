(function () {
  'use strict';

  function track(name, params) {
    if (typeof gtag === 'function') {
      gtag('event', name, params || {});
    } else if (window.dataLayer) {
      window.dataLayer.push(Object.assign({ event: name }, params || {}));
    }
  }

  function messengerMethod(a) {
    var href = a.getAttribute('href') || '';
    if (a.classList.contains('book-modal__item--tg') || href.indexOf('t.me') > -1)   return 'telegram';
    if (a.classList.contains('book-modal__item--vb') || href.indexOf('viber') > -1)  return 'viber';
    if (a.classList.contains('book-modal__item--wa') || href.indexOf('wa.me') > -1)  return 'whatsapp';
    if (a.classList.contains('book-modal__item--fb') || href.indexOf('m.me') > -1)   return 'messenger';
    if (a.classList.contains('book-modal__item--ig') || href.indexOf('ig.me') > -1)  return 'instagram';
    return null;
  }

  // Делегування на весь документ — працює і для кнопок у модалці, що зʼявляється динамічно.
  // Фаза capture (true), щоб подія встигла надіслатись до переходу на месенджер.
  document.addEventListener('click', function (e) {
    var el = e.target;

    var msg = el.closest('a.book-modal__item, a[href*="t.me"], a[href*="wa.me"], a[href*="viber"], a[href*="m.me"], a[href*="ig.me"]');
    if (msg) {
      var method = messengerMethod(msg);
      if (method) {
        track('booking_click', {
          method: method,
          page_path: window.location.pathname
        });
        return;
      }
    }

    var tel = el.closest('a[href^="tel:"]');
    if (tel) {
      track('phone_click', { page_path: window.location.pathname });
      return;
    }

    var book = el.closest('a.btn--primary, button.btn--primary');
    if (book && /запис/i.test(book.textContent || '')) {
      track('booking_open', { page_path: window.location.pathname });
    }
  }, true);
})();
