document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('.carousel').forEach(function (carousel) {
    const track  = carousel.querySelector('.carousel__track');
    const slides = carousel.querySelectorAll('.carousel__slide');
    const dots   = carousel.querySelectorAll('.carousel__dot');
    const prev   = carousel.querySelector('.carousel__nav--prev');
    const next   = carousel.querySelector('.carousel__nav--next');
    let current  = 0;
    let timer;

    function goTo(n) {
      current = (n + slides.length) % slides.length;
      track.style.transform = 'translateX(-' + current * 100 + '%)';
      dots.forEach(function (d, i) {
        d.classList.toggle('carousel__dot--active', i === current);
      });
    }

    function startAuto() {
      timer = setInterval(function () { goTo(current + 1); }, 10000);
    }

    function resetAuto() {
      clearInterval(timer);
      startAuto();
    }

    if (prev) prev.addEventListener('click', function () { goTo(current - 1); resetAuto(); });
    if (next) next.addEventListener('click', function () { goTo(current + 1); resetAuto(); });

    dots.forEach(function (d, i) {
      d.addEventListener('click', function () { goTo(i); resetAuto(); });
    });

    // Touch / swipe
    var startX = 0;
    track.addEventListener('touchstart', function (e) { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { goTo(dx < 0 ? current + 1 : current - 1); resetAuto(); }
    });

    goTo(0);
    startAuto();
  });
});
