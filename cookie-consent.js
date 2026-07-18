/* ═══════════════════════════════════════════════════════════
   AUTOMATE — cookie-consent.js
   GDPR/ePrivacy consent banner + preferences modal.
   Wires directly into Google Consent Mode v2 (the gtag
   'default' block runs in each page <head> before this).
   Stores: cookie_consent = granted_all | custom | denied_all
           cookie_analytics / cookie_marketing = granted | denied
═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  function gtag(){ (window.dataLayer = window.dataLayer || []).push(arguments); }

  var STORE = {
    consent: 'cookie_consent',
    analytics: 'cookie_analytics',
    marketing: 'cookie_marketing'
  };

  function apply(analytics, marketing) {
    gtag('consent', 'update', {
      analytics_storage: analytics ? 'granted' : 'denied',
      ad_storage:        marketing ? 'granted' : 'denied',
      ad_user_data:      marketing ? 'granted' : 'denied',
      ad_personalization:marketing ? 'granted' : 'denied'
    });
  }

  function save(kind, analytics, marketing) {
    try {
      localStorage.setItem(STORE.consent, kind);
      localStorage.setItem(STORE.analytics, analytics ? 'granted' : 'denied');
      localStorage.setItem(STORE.marketing, marketing ? 'granted' : 'denied');
    } catch (e) {}
    apply(analytics, marketing);
  }

  var BANNER = '\
<div id="cookie-banner" role="dialog" aria-live="polite" aria-label="Cookie consent">\
  <div class="cookie-banner-inner">\
    <div class="cookie-text">\
      <div class="cookie-title">We value your privacy</div>\
      <p class="cookie-desc">We use cookies to analyse traffic and improve your experience. You can accept all, reject non-essential, or choose what to allow. See our <a href="privacy.html">Privacy Policy</a>.</p>\
    </div>\
    <div class="cookie-actions">\
      <button class="cookie-btn cookie-btn-reject" id="cc-reject">Reject non-essential</button>\
      <button class="cookie-btn cookie-btn-prefs" id="cc-prefs">Preferences</button>\
      <button class="cookie-btn cookie-btn-accept" id="cc-accept">Accept all</button>\
    </div>\
  </div>\
</div>';

  var MODAL = '\
<div id="consent-modal" role="dialog" aria-modal="true" aria-label="Cookie preferences">\
  <div class="consent-modal-box">\
    <div class="consent-modal-title">Cookie preferences</div>\
    <p class="consent-modal-desc">Manage how we use cookies. Essential cookies are always on because the site can\u2019t function without them. Everything else is up to you.</p>\
    <div class="consent-option">\
      <div class="consent-option-info">\
        <span class="consent-option-name">Essential</span>\
        <span class="consent-option-desc">Required for core site functionality and security. Always active.</span>\
      </div>\
      <span class="consent-always-on">Always on</span>\
    </div>\
    <div class="consent-option">\
      <div class="consent-option-info">\
        <span class="consent-option-name">Analytics</span>\
        <span class="consent-option-desc">Anonymous usage statistics that help us understand what\u2019s useful and improve the site.</span>\
      </div>\
      <label class="consent-toggle"><input type="checkbox" id="cc-opt-analytics"><span class="consent-slider"></span></label>\
    </div>\
    <div class="consent-option">\
      <div class="consent-option-info">\
        <span class="consent-option-name">Marketing</span>\
        <span class="consent-option-desc">Used to measure campaigns and show relevant content. Off by default.</span>\
      </div>\
      <label class="consent-toggle"><input type="checkbox" id="cc-opt-marketing"><span class="consent-slider"></span></label>\
    </div>\
    <div class="consent-modal-footer">\
      <p class="consent-modal-legal">Read our <a href="privacy.html">Privacy Policy</a> for full details.</p>\
      <div class="consent-modal-actions">\
        <button class="cookie-btn cookie-btn-reject" id="cc-modal-reject">Reject all</button>\
        <button class="cookie-btn cookie-btn-accept" id="cc-modal-save">Save preferences</button>\
      </div>\
    </div>\
  </div>\
</div>';

  function init() {
    var wrap = document.createElement('div');
    wrap.innerHTML = BANNER + MODAL;
    while (wrap.firstChild) document.body.appendChild(wrap.firstChild);

    var banner = document.getElementById('cookie-banner');
    var modal  = document.getElementById('consent-modal');
    var optA   = document.getElementById('cc-opt-analytics');
    var optM   = document.getElementById('cc-opt-marketing');

    function showBanner() { requestAnimationFrame(function () { banner.style.transform = 'translateY(0)'; }); }
    function hideBanner() { banner.style.transform = 'translateY(120%)'; }
    function openModal() {
      try {
        optA.checked = localStorage.getItem(STORE.analytics) === 'granted';
        optM.checked = localStorage.getItem(STORE.marketing) === 'granted';
      } catch (e) {}
      modal.style.display = 'flex';
    }
    function closeModal() { modal.style.display = 'none'; }

    document.getElementById('cc-accept').onclick = function () { save('granted_all', true, true); hideBanner(); };
    document.getElementById('cc-reject').onclick = function () { save('denied_all', false, false); hideBanner(); };
    document.getElementById('cc-prefs').onclick  = openModal;
    document.getElementById('cc-modal-reject').onclick = function () { save('denied_all', false, false); closeModal(); hideBanner(); };
    document.getElementById('cc-modal-save').onclick = function () {
      var a = optA.checked, m = optM.checked;
      save(a || m ? 'custom' : 'denied_all', a, m);
      closeModal(); hideBanner();
    };
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });

    // reopen hook — wire any element with [data-cookie-settings]
    window.openCookieSettings = function () { openModal(); };
    document.querySelectorAll('[data-cookie-settings]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); openModal(); });
    });

    var prior;
    try { prior = localStorage.getItem(STORE.consent); } catch (e) {}
    if (!prior) showBanner();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
