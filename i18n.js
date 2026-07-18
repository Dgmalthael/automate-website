/* ═══════════════════════════════════════════════════════════
   AUTOMATE — i18n.js  (safe, self-contained)
   Applies translations to [data-i18n] (text) and
   [data-i18n-ph] (placeholder) nodes, and injects a language
   switcher into the header when more than one language exists.

   English lives in the HTML as the default, so if no extra
   translations are supplied this script does nothing visible —
   it will never blank out your copy.

   To add a language, extend window.TRANSLATIONS, e.g.:
     window.TRANSLATIONS = {
       de: { nav_solutions: 'Lösungen', hero_title: '…', … },
       fr: { … }
     };
   Keys map to the data-i18n / data-i18n-ph attribute values.
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var DEFAULT = 'en';
  var LABELS = { en: 'EN', de: 'DE', fr: 'FR', es: 'ES', it: 'IT', nl: 'NL', tr: 'TR', pl: 'PL', pt: 'PT' };
  var T = window.TRANSLATIONS || {};
  var langs = [DEFAULT].concat(Object.keys(T).filter(function (l) { return l !== DEFAULT; }));

  function stored() { try { return localStorage.getItem('lang'); } catch (e) { return null; } }
  function store(l) { try { localStorage.setItem('lang', l); } catch (e) {} }

  // capture the original English strings once, so switching back always restores them
  var base = { text: new WeakMap(), ph: new WeakMap() };
  function capture() {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      if (!base.text.has(el)) base.text.set(el, el.innerHTML);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      if (!base.ph.has(el)) base.ph.set(el, el.getAttribute('placeholder') || '');
    });
  }

  function apply(lang) {
    var dict = lang === DEFAULT ? null : T[lang];
    document.documentElement.setAttribute('lang', lang);

    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var key = el.getAttribute('data-i18n');
      if (dict && dict[key] != null) el.innerHTML = dict[key];
      else if (base.text.has(el)) el.innerHTML = base.text.get(el);
    });
    document.querySelectorAll('[data-i18n-ph]').forEach(function (el) {
      var key = el.getAttribute('data-i18n-ph');
      if (dict && dict[key] != null) el.setAttribute('placeholder', dict[key]);
      else if (base.ph.has(el)) el.setAttribute('placeholder', base.ph.get(el));
    });

    document.querySelectorAll('.lang-menu button').forEach(function (b) {
      b.classList.toggle('lang-active', b.getAttribute('data-lang') === lang);
    });
    var cur = document.querySelector('.lang-current-code');
    if (cur) cur.textContent = (LABELS[lang] || lang.toUpperCase());
    store(lang);

    // notify dynamic content (e.g. cms.js blog/article) to re-render
    try { document.dispatchEvent(new CustomEvent('langchange', { detail: lang })); } catch (e) {}
  }

  var NAMES = { en:'English', de:'Deutsch', fr:'Français', es:'Español', it:'Italiano', tr:'Türkçe', nl:'Nederlands', pl:'Polski', pt:'Português' };
  function injectSwitcher() {
    var nav = document.querySelector('header nav');
    if (!nav || document.querySelector('.lang-switch')) return;
    var wrap = document.createElement('div');
    wrap.className = 'lang-switch';

    var current = document.createElement('button');
    current.type = 'button';
    current.className = 'lang-current';
    current.setAttribute('aria-haspopup', 'listbox');
    current.setAttribute('aria-expanded', 'false');
    current.setAttribute('aria-label', 'Select language');
    current.innerHTML = "<i class='bx bx-globe'></i><span class='lang-current-code'>EN</span><i class='bx bx-chevron-down lang-caret'></i>";

    var menu = document.createElement('div');
    menu.className = 'lang-menu';
    menu.setAttribute('role', 'listbox');
    langs.forEach(function (l) {
      var b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('data-lang', l);
      b.setAttribute('role', 'option');
      b.innerHTML = "<span>" + (NAMES[l] || l) + "</span><span class='lang-code'>" + (LABELS[l] || l.toUpperCase()) + "</span>";
      b.addEventListener('click', function () { apply(l); close(); });
      menu.appendChild(b);
    });

    function open() { wrap.classList.add('open'); current.setAttribute('aria-expanded', 'true'); }
    function close() { wrap.classList.remove('open'); current.setAttribute('aria-expanded', 'false'); }
    current.addEventListener('click', function (e) {
      e.stopPropagation();
      if (wrap.classList.contains('open')) close(); else open();
    });
    document.addEventListener('click', function (e) { if (!wrap.contains(e.target)) close(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });

    wrap.appendChild(current);
    wrap.appendChild(menu);
    nav.appendChild(wrap);
  }

  function init() {
    capture();
    if (langs.length > 1) injectSwitcher();
    var start = stored();
    if (!start || langs.indexOf(start) === -1) start = DEFAULT;
    apply(start);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for manual control if needed
  window.setLanguage = apply;
})();
