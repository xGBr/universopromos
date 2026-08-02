/* ===========================================================
   Universo Promos — Efeitos de rolagem
   ===========================================================
   - Cabeçalho ganha fundo/blur mais forte após rolar um pouco.
   - Seções aparecem com um leve fade + deslize ao entrar na tela.
   - Os brilhos de fundo (.glow-a / .glow-b) se movem sutilmente
     em velocidades diferentes do conteúdo (efeito parallax leve).
   Tudo é desativado automaticamente se o usuário tiver ativado
   "reduzir movimento" nas preferências do sistema/navegador.
   =========================================================== */

(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- cabeçalho: estado "rolado" ----------
  const header = document.querySelector('header');
  function updateHeaderState() {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 8);
  }

  // ---------- parallax leve nos brilhos de fundo ----------
  function updateParallax() {
    document.documentElement.style.setProperty('--parallax-y', window.scrollY + 'px');
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeaderState();
      if (!prefersReducedMotion) updateParallax();
      ticking = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  updateHeaderState();
  if (!prefersReducedMotion) updateParallax();

  // ---------- revelação suave das seções ----------
  const revealTargets = document.querySelectorAll('main > .wrap > section');

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((el) => el.classList.add('is-visible'));
  } else {
    revealTargets.forEach((el) => el.classList.add('reveal'));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    revealTargets.forEach((el) => observer.observe(el));

    // A primeira seção (hero) já entra visível, sem esperar rolagem.
    const firstSection = document.querySelector('main > .wrap > section');
    if (firstSection) {
      firstSection.classList.add('is-visible');
      observer.unobserve(firstSection);
    }
  }
})();
