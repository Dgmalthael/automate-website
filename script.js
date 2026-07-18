/* ═══════════════════════════════════════════════════════════
   AUTOMATE — script.js (v2)
   Header state · mobile nav · FAQ · forms · particle background
   Loaded as <script type="module"> — three.js comes from the
   importmap declared in each page's <head>.
═══════════════════════════════════════════════════════════ */

/* ── Header scroll state ─────────────────────────────────── */
const header = document.querySelector('header');
if (header) {
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 24);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

/* ── Mobile nav toggle ───────────────────────────────────── */
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('header nav');
if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    navToggle.classList.toggle('open', open);
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  nav.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => {
      nav.classList.remove('open');
      navToggle.classList.remove('open');
    })
  );
}

/* ── FAQ accordion ───────────────────────────────────────── */
document.querySelectorAll('.faq-question').forEach(btn => {
  btn.addEventListener('click', () => {
    const answer = btn.nextElementSibling;
    const isOpen = btn.getAttribute('aria-expanded') === 'true';
    // close others
    document.querySelectorAll('.faq-question[aria-expanded="true"]').forEach(other => {
      if (other !== btn) {
        other.setAttribute('aria-expanded', 'false');
        if (other.nextElementSibling) other.nextElementSibling.classList.remove('open');
      }
    });
    btn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    if (answer) answer.classList.toggle('open', !isOpen);
  });
});

/* ── Forms (contact + newsletter) ────────────────────────── */
function wireForm(formId, popupId, successMsg) {
  const form = document.getElementById(formId);
  const popup = document.getElementById(popupId);
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const original = btn ? btn.textContent : '';
    if (btn) { btn.disabled = true; btn.textContent = '…'; }
    try {
      await fetch(form.action, { method: 'POST', mode: 'no-cors', body: new FormData(form) });
      showPopup(popup, successMsg, true);
      form.reset();
    } catch {
      showPopup(popup, 'Something went wrong — please email us directly.', false);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = original; }
    }
  });
}
function showPopup(popup, msg, ok) {
  if (!popup) return;
  popup.textContent = msg;
  popup.classList.remove('popup-ok', 'popup-err');
  popup.classList.add('show', ok ? 'popup-ok' : 'popup-err');
  clearTimeout(popup._t);
  popup._t = setTimeout(() => popup.classList.remove('show'), 6000);
}
wireForm('contact-form', 'popupMessage', 'Message sent — we\u2019ll get back to you within 24 hours.');
wireForm('newsletter-form', 'newsletter-popup', 'Subscribed. See you in your inbox.');

/* ── Particle field background (three.js) ────────────────── */
/* A quiet, slow wave of points behind the hero. Brand-tinted,
   capped at 30fps, paused when the tab is hidden, skipped
   entirely for reduced-motion users and small screens.      */
(async () => {
  const mount = document.getElementById('conteiner3D');
  if (!mount) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (window.innerWidth < 640) return;

  let THREE;
  try { THREE = await import('three'); } catch { return; }

  try {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 2.2, 7.5);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(window.innerWidth, window.innerHeight);
    mount.appendChild(renderer.domElement);

    // grid of points
    const COLS = 90, ROWS = 42, SPACING = 0.28;
    const count = COLS * ROWS;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const cA = new THREE.Color('#e14bdb');   // accent orchid
    const cB = new THREE.Color('#6b6bf5');   // soft indigo
    const tmp = new THREE.Color();
    let i = 0;
    for (let x = 0; x < COLS; x++) {
      for (let z = 0; z < ROWS; z++) {
        positions[i * 3]     = (x - COLS / 2) * SPACING;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (z - ROWS / 2) * SPACING - 1.5;
        tmp.copy(cB).lerp(cA, x / COLS);
        colors[i * 3] = tmp.r; colors[i * 3 + 1] = tmp.g; colors[i * 3 + 2] = tmp.b;
        i++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.028,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    scene.add(new THREE.Points(geo, mat));

    const pos = geo.attributes.position;
    const wave = t => {
      for (let j = 0; j < count; j++) {
        const x = pos.getX(j), z = pos.getZ(j);
        pos.setY(j, Math.sin(x * 0.55 + t) * 0.35 + Math.cos(z * 0.7 + t * 0.8) * 0.25);
      }
      pos.needsUpdate = true;
    };

    if (reduced) { wave(1.6); renderer.render(scene, camera); return; }

    let last = 0, running = true;
    const FRAME = 1000 / 30;
    const loop = ts => {
      requestAnimationFrame(loop);
      if (!running || ts - last < FRAME) return;
      last = ts;
      wave(ts * 0.00045);
      renderer.render(scene, camera);
    };
    requestAnimationFrame(loop);

    document.addEventListener('visibilitychange', () => { running = !document.hidden; });
    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  } catch (err) {
    console.warn('Particle background disabled:', err);
  }
})();

/* ── Scroll reveals (staggered) ───────────────────────────── */
(function () {
  window.__revealReady = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Guaranteed floor: show an element WITHOUT relying on a CSS transition.
  // (Transitions never advance while a tab is hidden/prerendered, which would
  //  otherwise leave gated content stuck at opacity 0 forever.)
  const forceShow = el => {
    el.classList.add('in-view');
    el.style.transition = 'none';
    el.style.opacity = '1';
    el.style.transform = 'none';
    el.style.filter = 'none';
  };
  const forceShowAll = () =>
    document.querySelectorAll('.autoBlur, .reveal').forEach(forceShow);

  // Tag staggered child groups so items rise in sequence.
  const groups = [
    ['.hero-content', ':scope > *'],
    ['.wwd-rows', '.wwd-row'],
    ['.steps-grid', '.step-card'],
    ['.sol-group', '.sol-row'],
    ['.values-grid', '.value-card'],
    ['.product-detail-grid', '.product-detail-card'],
    ['.pricing-steps', '.pricing-step-card'],
    ['.approach-body', '.approach-step'],
    ['.contact-points', 'li'],
    ['.blog-grid', '.blog-card'],
    ['.footer-links', '.footer-col']
  ];
  const tag = (container, sel) =>
    container.querySelectorAll(sel).forEach((el, i) => {
      el.classList.add('reveal');
      el.style.setProperty('--i', i % 6);
    });
  groups.forEach(([c, i]) => document.querySelectorAll(c).forEach(cont => tag(cont, i)));

  function watchBlogGrid(handle) {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;
    new MutationObserver(() =>
      grid.querySelectorAll('.blog-card:not(.in-view)').forEach(handle)
    ).observe(grid, { childList: true });
  }

  // Entrance animation can't run reliably here → just show everything now.
  //   • reduced-motion   • no IntersectionObserver   • document hidden at load
  if (reduce || !('IntersectionObserver' in window) || document.hidden) {
    forceShowAll();
    watchBlogGrid(forceShow);
    return;
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

  const scan = () =>
    document.querySelectorAll('.autoBlur:not(.in-view), .reveal:not(.in-view)').forEach(el => io.observe(el));
  scan();

  // Above-the-fold content animates in immediately (document is visible).
  document.querySelectorAll('.autoBlur:not(.in-view), .reveal:not(.in-view)').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.98 && r.bottom > 0) el.classList.add('in-view');
  });

  // Blog cards added later by a fetch-based CMS.
  watchBlogGrid(el => {
    el.classList.add('reveal');
    el.style.setProperty('--i', 0);
    io.observe(el);
  });

  // If the tab becomes visible later, guarantee anything left stuck (a
  // transition that never advanced while hidden) is shown.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    document.querySelectorAll('.in-view').forEach(el => {
      if (window.getComputedStyle(el).opacity === '0') forceShow(el);
    });
  });

  // Last-resort floor: after load, force-show any in-viewport element still hidden.
  window.addEventListener('load', () => setTimeout(() => {
    document.querySelectorAll('.autoBlur, .reveal').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0 && window.getComputedStyle(el).opacity === '0') forceShow(el);
    });
  }, 500));
})();
