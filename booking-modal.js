(function () {
  'use strict';

  /* ── Inject modal HTML ── */
  var modal = document.createElement('div');
  modal.id = 'bookModal';
  modal.className = 'book-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-label', 'Оберіть месенджер для запису');

  modal.innerHTML = [
    '<div class="book-modal__backdrop"></div>',
    '<div class="book-modal__box">',
      '<button class="book-modal__close" aria-label="Закрити">',
        '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="3" x2="15" y2="15"/><line x1="15" y1="3" x2="3" y2="15"/></svg>',
      '</button>',
      '<p class="book-modal__title">Записатися</p>',
      '<p class="book-modal__sub">Оберіть зручний месенджер — відповімо якнайшвидше</p>',
      '<div class="book-modal__list">',

        /* Telegram */
        '<a href="https://t.me/+380962817338" target="_blank" rel="noopener" class="book-modal__item book-modal__item--tg">',
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
          '<span>Telegram</span>',
        '</a>',

        /* Viber */
        '<a href="viber://chat?number=%2B380962817338" class="book-modal__item book-modal__item--vb">',
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M11.4 0C5.109 0 0 5.109 0 11.4c0 2.053.571 4.037 1.567 5.745L0 24l6.855-1.567A11.37 11.37 0 0011.4 22.8C17.691 22.8 22.8 17.691 22.8 11.4 22.8 5.109 17.691 0 11.4 0zm3.463 16.8c-.444.124-1.24.284-2.311-.104-1.071-.389-2.071-1.054-3.005-2.109-.934-1.054-1.556-2.196-1.868-3.349-.311-1.152-.249-2.051.187-2.7.437-.648 1.009-.894 1.432-.934h.623c.249 0 .498.125.623.373l1.12 2.549c.124.249.062.559-.125.745l-.684.685c-.187.187-.187.436-.062.623.498.934 1.307 1.868 2.364 2.549.187.124.436.062.56-.124l.622-.934c.187-.249.498-.311.747-.187l2.364 1.182c.249.125.373.375.311.623-.062.374-.436 1.057-.9 1.182z"/></svg>',
          '<span>Viber</span>',
        '</a>',

        /* WhatsApp */
        '<a href="https://wa.me/380962817338" target="_blank" rel="noopener" class="book-modal__item book-modal__item--wa">',
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
          '<span>WhatsApp</span>',
        '</a>',

        /* Facebook Messenger */
        '<a href="https://m.me/vulyk.clinic" target="_blank" rel="noopener" class="book-modal__item book-modal__item--fb">',
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 0C5.374 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.626 0 12-4.974 12-11.111S18.626 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z"/></svg>',
          '<span>Facebook Messenger</span>',
        '</a>',

        /* Instagram */
        '<a href="https://ig.me/m/vulyk.clinic" target="_blank" rel="noopener" class="book-modal__item book-modal__item--ig">',
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
          '<span>Instagram</span>',
        '</a>',

      '</div>',
    '</div>'
  ].join('');

  document.body.appendChild(modal);

  /* ── Open / Close ── */
  function openModal() {
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modal.querySelector('.book-modal__close').focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  modal.querySelector('.book-modal__backdrop').addEventListener('click', closeModal);
  modal.querySelector('.book-modal__close').addEventListener('click', closeModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  /* ── Intercept all booking buttons ── */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('a, button');
    if (!el) return;
    var txt = el.textContent.trim();
    if (txt.indexOf('Записатис') === 0 || txt === 'Записатися') {
      e.preventDefault();
      openModal();
    }
  });

})();
