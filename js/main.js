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
  const INTRO_DURATION = 3500; // ms

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
   INIT ANIMATION SVG INTRO — VERSION CORRIGÉE
   Problème original : conflit entre JS inline styles (strokeDashoffset)
   et @keyframes CSS qui animaient la même propriété.
   Solution : on supprime les @keyframes, on utilise CSS transition
   déclenchée via JS (double rAF pour forcer le repaint).
───────────────────────────────────────── */
function initIntroSvgAnimation() {
  const svg = document.querySelector('#intro-screen .intro-svg');
  if (!svg) return;

  const strokePaths = Array.from(svg.querySelectorAll('.svg-stroke'));
  const fillPaths   = svg.querySelectorAll('.svg-fill');
  if (!strokePaths.length) return;

  /* Délai (ms) et durée (ms) par path — effet cascade naturel */
  const config = [
    { delay: 80,  duration: 1400 }, // path 1 — grand contour extérieur
    { delay: 300, duration: 1250 }, // path 2 — contour intérieur
    { delay: 560, duration: 550  }, // path 3 — petite barre haut
    { delay: 680, duration: 350  }, // path 4 — connecteur gauche
    { delay: 720, duration: 280  }, // path 5 — connecteur droit
  ];

  strokePaths.forEach((path, i) => {
    const cfg    = config[i] || { delay: 0, duration: 800 };
    const length = path.getTotalLength();

    /* 1. Masquer complètement le path au départ */
    path.style.strokeDasharray  = length;
    path.style.strokeDashoffset = length;
    path.style.transition       = 'none';

    /* 2. Après le délai propre à ce path, déclencher le tracé.
          Double requestAnimationFrame : garantit que le navigateur
          a bien rendu l'état initial (dashoffset=length) avant la transition */
    setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          path.style.transition       = 'stroke-dashoffset ' + cfg.duration + 'ms cubic-bezier(0.25, 0.46, 0.45, 0.94)';
          path.style.strokeDashoffset = '0';
        });
      });
    }, cfg.delay);
  });

  /* 3. Afficher les fills après le dernier tracé */
  const last      = config[config.length - 1];
  const fillDelay = last.delay + last.duration + 120;
  setTimeout(() => {
    fillPaths.forEach(path => path.classList.add('visible'));
  }, fillDelay);
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
   CALENDLY — auto-height via postMessage officiel
   Calendly widget.js envoie la hauteur du contenu
   via window.postMessage. On resize le wrapper en conséquence
   pour éviter le scroll interne, surtout sur mobile.
───────────────────────────────────────── */
function initCalendlyAutoHeight() {
  const wrap   = document.getElementById('calendlyWrap');
  const widget = document.getElementById('calendlyWidget');
  if (!wrap || !widget) return;

  /* Hauteur initiale adaptée à l'écran — évite le vide avant le postMessage */
  const isMobile = window.innerWidth <= 600;
  const isTablet = window.innerWidth <= 900;
  const initialH = isMobile ? 680 : isTablet ? 720 : 700;
  wrap.style.height   = initialH + 'px';
  widget.style.height = initialH + 'px';

  window.addEventListener('message', function(e) {
    if (!e.data || !e.data.event) return;
    const ev = e.data.event;

    /* calendly.page_height — hauteur exacte envoyée par Calendly
       On applique SANS marge supplémentaire pour éviter l'espace en bas */
    if (ev === 'calendly.page_height' && e.data.payload && e.data.payload.height) {
      const h = parseInt(e.data.payload.height, 10);
      if (h > 200) {
        /* Sur mobile : pas de marge extra — on serre au pixel près */
        const margin = isMobile ? 0 : 20;
        wrap.style.height   = (h + margin) + 'px';
        widget.style.height = (h + margin) + 'px';
      }
    }

    /* Ajustement lors du changement de vue dans Calendly */
    if (ev === 'calendly.event_type_viewed' || ev === 'calendly.date_and_time_selected') {
      /* Demande la hauteur actuelle — Calendly la renvoie via page_height */
      const iframe = widget.querySelector('iframe');
      if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({ event: 'calendly.page_height_request' }, '*');
      }
    }

    /* Track Plausible */
    if (window.plausible && ev.startsWith('calendly.')) {
      plausible('Calendly', { props: { action: ev.replace('calendly.', '') } });
    }
  });

  /* Recalcul au resize (rotation mobile) */
  window.addEventListener('resize', function() {
    const iframe = widget.querySelector('iframe');
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage({ event: 'calendly.page_height_request' }, '*');
    }
  }, { passive: true });
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
  initIntroSvgAnimation();
  initCalendlyAutoHeight();
});
