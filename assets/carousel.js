/* ===========================================================
   Universo Promos — Carrossel de banners ("Ofertas da semana")
   ===========================================================
   Configuração:
   - Tempo de troca automática: atributo data-interval (em ms)
     no elemento .carousel-card, no HTML. Ex: data-interval="6000"
     troca a cada 6 segundos.
   - Slides: qualquer quantidade de <div class="carousel-slide">
     dentro de .carousel-track — as setas e bolinhas se adaptam
     automaticamente à quantidade de slides.
   =========================================================== */

(function () {
  'use strict';

  function initCarousel(root) {
    const track = root.querySelector('.carousel-track');
    const slides = track ? Array.from(track.children) : [];
    const dotsWrap = root.querySelector('.carousel-dots');
    const prevBtn = root.querySelector('.carousel-arrow.prev');
    const nextBtn = root.querySelector('.carousel-arrow.next');

    // Menos de 2 slides: não faz sentido ter carrossel, esconde os controles.
    if (slides.length < 2) {
      if (dotsWrap) dotsWrap.style.display = 'none';
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      if (slides.length === 1) slides[0].classList.add('is-active');
      return;
    }

    const interval = parseInt(root.dataset.interval, 10) || 6000;
    let current = 0;
    let timer = null;

    // Cria uma bolinha para cada slide
    slides.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carousel-dot';
      dot.setAttribute('aria-label', 'Ir para o banner ' + (index + 1));
      dot.addEventListener('click', () => goTo(index));
      dotsWrap.appendChild(dot);
    });
    const dots = Array.from(dotsWrap.children);

    function render() {
      slides.forEach((slide, index) => slide.classList.toggle('is-active', index === current));
      dots.forEach((dot, index) => dot.classList.toggle('is-active', index === current));
    }

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      render();
      restart();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    function restart() {
      clearInterval(timer);
      timer = setInterval(next, interval);
    }

    if (prevBtn) prevBtn.addEventListener('click', prev);
    if (nextBtn) nextBtn.addEventListener('click', next);

    // Pausa a troca automática enquanto o mouse ou o teclado estiver ali
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', restart);
    root.addEventListener('focusin', () => clearInterval(timer));
    root.addEventListener('focusout', restart);

    render();
    restart();
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.carousel-card').forEach(initCarousel);
  });
})();
