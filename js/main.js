/* ═══════════════════════════════════════════════════════════════
   Se7en Club — main.js
   Animations : intro screen · compteurs · scroll reveal · lightbox
═══════════════════════════════════════════════════════════════ */

'use strict';

/* ─────────────────────────────────────────
   1. INTRO SCREEN
   Séquence : intro visible 1.8s → fade out → hero reveal
───────────────────────────────────────── */
function runIntro() {
  const intro  = document.getElementById('intro-screen');
  const nav    = document.getElementById('main-nav');
  const heroes = document.querySelectorAll('.reveal-hero');

  if (!intro) return;

  // Durée de l'intro avant de disparaître
  const INTRO_DURATION = 1900; // ms

  setTimeout(() => {
    // 1. Cache l'intro
    intro.classList.add('hidden');

    // 2. Fait entrer la nav
    setTimeout(() => {
      nav.classList.add('visible');
    }, 100);

    // 3. Anime les éléments hero en séquence
    setTimeout(() => {
      heroes.forEach(el => el.classList.add('visible'));
    }, 300);

    // 4. Nettoie le DOM après la transition
    setTimeout(() => {
      intro.remove();
    }, 1200);

  }, INTRO_DURATION);
}


/* ─────────────────────────────────────────
   2. SCROLL REVEAL
   IntersectionObserver : chaque élément .scroll-reveal
   entre en scène quand il est visible à 12%
───────────────────────────────────────── */
function initScrollReveal() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // une seule fois
        }
      });
    },
    { threshold: 0.12 }
  );

  document.querySelectorAll('.scroll-reveal').forEach(el => observer.observe(el));
}


/* ─────────────────────────────────────────
   3. COMPTEURS ANIMÉS
   Déclenchés au scroll via IntersectionObserver
   Easing : easeOutCubic — accélère puis ralentit
───────────────────────────────────────── */
function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCounter(el, target, prefix, duration) {
  const start = performance.now();

  function tick(now) {
    const elapsed  = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const value    = Math.round(easeOutCubic(progress) * target);

    el.textContent = prefix + value;

    if (progress < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

function initCounters() {
  const statEls = document.querySelectorAll('.stat-num[data-target]');
  if (!statEls.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;

        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const prefix = el.dataset.prefix || '';

        // Délai léger par index pour un effet cascade
        const index = [...statEls].indexOf(el);
        setTimeout(() => {
          animateCounter(el, target, prefix, 1400);
        }, index * 120);

        observer.unobserve(el);
      });
    },
    { threshold: 0.5 }
  );

  statEls.forEach(el => observer.observe(el));
}


/* ─────────────────────────────────────────
   4. NAV — lien actif au scroll
───────────────────────────────────────── */
function initActiveNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-links a');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach(a => {
          const isActive = a.getAttribute('href') === '#' + id;
          a.style.color = isActive ? 'var(--white)' : '';
        });
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach(s => observer.observe(s));
}


/* ─────────────────────────────────────────
   5. FORMULAIRE DE CONTACT + TOAST
───────────────────────────────────────── */
function initForm() {
  const form  = document.getElementById('contactForm');
  const toast = document.getElementById('toast');
  if (!form || !toast) return;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }

  form.addEventListener('submit', function(e) {
    if (form.action.includes('VOTRE_ID')) {
      e.preventDefault();
      showToast('Configurez Formspree pour activer l\'envoi !');
      return;
    }
    showToast('Message envoyé — Merci !');
  });
}


/* ─────────────────────────────────────────
   6. GLIGHTBOX
───────────────────────────────────────── */
function initLightbox() {
  if (typeof GLightbox === 'undefined') return;
  GLightbox({
    selector: '.glightbox',
    touchNavigation: true,
    loop: true,
    autoplayVideos: true,
    openEffect: 'fade',
    closeEffect: 'fade',
  });
}


/* ─────────────────────────────────────────
   7. CURSEUR MAGNÉTIQUE sur les boutons CTA
   Effet subtil : le bouton suit légèrement la souris
───────────────────────────────────────── */
function initMagneticButtons() {
  // Seulement sur desktop (pas tactile)
  if (window.matchMedia('(hover: none)').matches) return;

  document.querySelectorAll('.btn-primary, .nav-cta, .form-submit').forEach(btn => {
    btn.addEventListener('mousemove', (e) => {
      const rect   = btn.getBoundingClientRect();
      const cx     = rect.left + rect.width  / 2;
      const cy     = rect.top  + rect.height / 2;
      const dx     = (e.clientX - cx) * 0.18;
      const dy     = (e.clientY - cy) * 0.18;
      btn.style.transform = `translate(${dx}px, ${dy}px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}


/* ─────────────────────────────────────────
   INIT — tout démarre ici
───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  runIntro();
  initScrollReveal();
  initCounters();
  initActiveNav();
  initForm();
  initLightbox();
  initMagneticButtons();
});
