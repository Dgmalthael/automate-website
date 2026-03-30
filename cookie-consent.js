/* ══════════════════════════════════════
   COOKIE CONSENT — GA4 Consent Mode v2
══════════════════════════════════════ */

const CONSENT_KEY   = 'cookie_consent';
const ANALYTICS_KEY = 'cookie_analytics';
const MARKETING_KEY = 'cookie_marketing';

function updateConsent(analytics, marketing) {
  if (typeof gtag === 'function') {
    gtag('consent', 'update', {
      analytics_storage:  analytics,
      ad_storage:         marketing,
      ad_user_data:       marketing,
      ad_personalization: marketing
    });
  }
}

function acceptAll() {
  localStorage.setItem(CONSENT_KEY,   'granted_all');
  localStorage.setItem(ANALYTICS_KEY, 'granted');
  localStorage.setItem(MARKETING_KEY, 'granted');
  updateConsent('granted', 'granted');
  hideBanner();
}

function rejectAll() {
  localStorage.setItem(CONSENT_KEY,   'denied_all');
  localStorage.setItem(ANALYTICS_KEY, 'denied');
  localStorage.setItem(MARKETING_KEY, 'denied');
  updateConsent('denied', 'denied');
  hideBanner();
}

function savePreferences() {
  const analytics = document.getElementById('consent-analytics').checked ? 'granted' : 'denied';
  const marketing = document.getElementById('consent-marketing').checked ? 'granted' : 'denied';
  const key = (analytics === 'granted' && marketing === 'granted') ? 'granted_all'
            : (analytics === 'denied'  && marketing === 'denied')  ? 'denied_all'
            : 'custom';
  localStorage.setItem(CONSENT_KEY,   key);
  localStorage.setItem(ANALYTICS_KEY, analytics);
  localStorage.setItem(MARKETING_KEY, marketing);
  updateConsent(analytics, marketing);
  hideModal();
  hideBanner();
}

function hideBanner() {
  const banner = document.getElementById('cookie-banner');
  if (banner) {
    banner.style.transform = 'translateY(120%)';
    setTimeout(() => banner.remove(), 400);
  }
}

function showModal() {
  const modal = document.getElementById('consent-modal');
  if (modal) {
    modal.style.display = 'flex';
    const storedAnalytics = localStorage.getItem(ANALYTICS_KEY) || 'denied';
    const storedMarketing = localStorage.getItem(MARKETING_KEY) || 'denied';
    document.getElementById('consent-analytics').checked = storedAnalytics === 'granted';
    document.getElementById('consent-marketing').checked = storedMarketing === 'granted';
  }
}

function hideModal() {
  const modal = document.getElementById('consent-modal');
  if (modal) modal.style.display = 'none';
}

function injectBanner() {
  /* ── Banner ── */
  const banner = document.createElement('div');
  banner.id = 'cookie-banner';
  banner.innerHTML = `
    <div class="cookie-banner-inner">
      <div class="cookie-text">
        <p class="cookie-title">We use cookies</p>
        <p class="cookie-desc">We use cookies to improve your experience, analyse traffic, and serve personalised content. By clicking <strong>Accept All</strong> you consent to our use of cookies. See our <a href="privacy.html">Privacy Policy</a> for details.</p>
      </div>
      <div class="cookie-actions">
        <button class="cookie-btn cookie-btn-reject"  onclick="rejectAll()">Reject All</button>
        <button class="cookie-btn cookie-btn-prefs"   onclick="showModal()">Preferences</button>
        <button class="cookie-btn cookie-btn-accept"  onclick="acceptAll()">Accept All</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
  setTimeout(() => { banner.style.transform = 'translateY(0)'; }, 60);

  /* ── Preferences modal ── */
  const modal = document.createElement('div');
  modal.id = 'consent-modal';
  modal.innerHTML = `
    <div class="consent-modal-box">
      <h3 class="consent-modal-title">Cookie Preferences</h3>
      <p class="consent-modal-desc">Manage your cookie settings. Necessary cookies are always active as they are required for the site to function.</p>

      <div class="consent-option">
        <div class="consent-option-info">
          <span class="consent-option-name">Necessary</span>
          <span class="consent-option-desc">Essential for the website to function. Cannot be disabled.</span>
        </div>
        <span class="consent-always-on">Always on</span>
      </div>

      <div class="consent-option">
        <div class="consent-option-info">
          <span class="consent-option-name">Analytics</span>
          <span class="consent-option-desc">Help us understand how visitors interact with the site (Google Analytics 4).</span>
        </div>
        <label class="consent-toggle">
          <input type="checkbox" id="consent-analytics">
          <span class="consent-slider"></span>
        </label>
      </div>

      <div class="consent-option">
        <div class="consent-option-info">
          <span class="consent-option-name">Marketing</span>
          <span class="consent-option-desc">Used to measure advertising effectiveness and serve relevant ads.</span>
        </div>
        <label class="consent-toggle">
          <input type="checkbox" id="consent-marketing">
          <span class="consent-slider"></span>
        </label>
      </div>

      <div class="consent-modal-footer">
        <p class="consent-modal-legal">For more information see our <a href="privacy.html">Privacy Policy</a>.</p>
        <div class="consent-modal-actions">
          <button class="cookie-btn cookie-btn-reject" onclick="hideModal()">Cancel</button>
          <button class="cookie-btn cookie-btn-accept" onclick="savePreferences()">Save Preferences</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => { if (e.target === modal) hideModal(); });
}

document.addEventListener('DOMContentLoaded', function () {
  if (!localStorage.getItem(CONSENT_KEY)) {
    injectBanner();
  }
});
