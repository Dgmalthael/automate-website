/* ═══════════════════════════════════════════════════════════
   AUTOMATE — cms.js  (redesign)
   ───────────────────────────────────────────────────────────
   Live blog CMS backed by the same Google Sheets / Apps Script
   endpoint the original site uses. Articles are authored in a
   sheet tab named "Articles"; this file fetches them and renders:
     • blog.html    → fills #blog-grid with cards + wires filters
     • article.html → reads ?slug= and fills the article layout

   Sheet columns (row 1 headers, lowercased + underscored):
     slug  title  date  read_time  category  category_label
     summary  author  spotlight  content  image_url
   ═══════════════════════════════════════════════════════════ */

const CMS_URL = 'https://script.google.com/macros/s/AKfycbwxsoDf2PAlgyDQ-khyeJyQm9h24CQYNUzliQ7zP9giIWdlTJo6onARhT35tnd-5HiE3Q/exec';

var CAT_LABEL = { 'generative-ai': 'Generative AI', 'automation': 'Automation', 'guides': 'Guides', 'industry': 'Industry' };

/* ── active language + translated-field picker ──
   Reads the same localStorage key i18n.js uses. For a non-English
   language, prefer the translated column (e.g. title_fr); fall back to
   the English column whenever a translation is missing, so a post is
   never blank — mirroring i18n.js's fallback behaviour. */
function cmsLang() { try { return localStorage.getItem('lang') || 'en'; } catch (e) { return 'en'; } }
function tr(a, name) {
  var l = cmsLang();
  if (l && l !== 'en') {
    var v = a[name + '_' + l];
    if (v != null && String(v).trim() !== '') return v;
  }
  return a[name];
}

/* ── fetch all articles from Apps Script (cached, so switching language
   re-renders instantly instead of re-hitting the network) ── */
var _articlesCache = null;
async function fetchArticles() {
  if (_articlesCache) return _articlesCache;
  try {
    const res  = await fetch(CMS_URL);
    const data = await res.json();
    _articlesCache = Array.isArray(data) ? data.filter(a => a.slug) : [];
  } catch (err) {
    console.error('[CMS] Could not load articles:', err);
    _articlesCache = [];
  }
  return _articlesCache;
}

function formatDate(raw) {
  const d = new Date(raw);
  if (isNaN(d)) return String(raw); // fallback: use as-is (e.g. "Mar 2025")
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : s; return d.innerHTML; }

function tagLabel(a) { return a.category_label || CAT_LABEL[a.category] || 'Article'; }

function metaDate(a) {
  var d = formatDate(a.date);
  return a.read_time ? d + ' · ' + esc(a.read_time) : d;
}

/* ════════════════════════════════════════════════════════════
   BLOG PAGE  —  renders article grid from sheet data
   ════════════════════════════════════════════════════════════ */
async function initBlog() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  if (!_articlesCache) {
    grid.innerHTML = `
      <div class="cms-loading" id="cms-loading">
        <i class='bx bx-loader-alt cms-spinner'></i>
        <span>Loading articles…</span>
      </div>`;
  }

  const articles = await fetchArticles();
  grid.innerHTML = '';

  if (!articles.length) {
    grid.innerHTML = `
      <div class="blog-empty">
        <i class='bx bx-news blog-empty-icon'></i>
        <h3>Articles coming soon</h3>
        <p>New writing on AI automation is on the way. Check back soon, or subscribe below to get notified.</p>
      </div>`;
    return;
  }

  articles.forEach(a => {
    const url     = `article.html?slug=${encodeURIComponent(a.slug)}`;
    const imgCls  = `blog-img-${a.category}`;
    const cover   = a.image_url
      ? `<img src="${esc(a.image_url)}" alt="${esc(tr(a, 'title'))}" class="blog-card-cover-img" loading="lazy">`
      : '';

    if (String(a.spotlight).toUpperCase() === 'TRUE') {
      const el = document.createElement('article');
      el.className = 'blog-card-spotlight';
      el.dataset.category = a.category;
      el.innerHTML = `
        <a href="${url}" class="link-reset spotlight-img ${imgCls}">${cover}</a>
        <div class="spotlight-body">
          <div class="spotlight-meta">
            <span class="article-tag">Spotlight</span>
            <span class="mono-tag article-date">${formatDate(a.date)}</span>
          </div>
          <h2>${esc(tr(a, 'title'))}</h2>
          <p>${esc(tr(a, 'summary'))}</p>
          <div class="article-author" style="margin-top:1.5rem">
            <span class="author-name">${esc(a.author)}</span>
          </div>
          <a href="${url}" class="link-reset">
            <button class="btn-learn-more" style="margin-top:1.5rem">Read full article <span class="arrow">→</span></button>
          </a>
        </div>`;
      grid.appendChild(el);
    } else {
      const el = document.createElement('article');
      el.className = 'blog-card';
      el.dataset.category = a.category;
      el.innerHTML = `
        <a href="${url}" class="link-reset blog-card-img ${imgCls}">
          ${cover}
        </a>
        <div class="blog-card-body">
          <div class="article-meta-row" style="margin-bottom:0.75rem">
            <span class="article-tag">${esc(tagLabel(a))}</span>
            <span class="mono-tag article-date">${metaDate(a)}</span>
          </div>
          <h3>${esc(tr(a, 'title'))}</h3>
          <p>${esc(tr(a, 'summary'))}</p>
          <a href="${url}" class="btn-item">Read article <span class="arrow">→</span></a>
        </div>`;
      grid.appendChild(el);
    }
  });

  /* re-wire filter buttons after cards are in the DOM */
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('filter-active'));
      btn.classList.add('filter-active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.blog-card, .blog-card-spotlight').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });
}

/* ════════════════════════════════════════════════════════════
   ARTICLE PAGE  —  renders the article matching ?slug=
   article.html?slug=your-article-slug
   ════════════════════════════════════════════════════════════ */
async function initArticle() {
  const content = document.getElementById('article-content');
  if (!content) return;

  const slug = new URLSearchParams(window.location.search).get('slug');
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  if (!slug) {
    set('article-title', 'No article specified.');
    content.innerHTML = '<p>Please return to the <a href="blog.html">blog</a> and select an article.</p>';
    return;
  }

  /* loading state */
  set('article-tag', '');
  set('article-date', '');
  document.getElementById('article-title').innerHTML = '<span class="article-loading-title">Loading…</span>';
  set('article-lead', '');
  set('article-author-name', '');
  content.innerHTML = `
    <div class="cms-loading">
      <i class='bx bx-loader-alt cms-spinner'></i>
      <span>Loading article…</span>
    </div>`;

  const articles = await fetchArticles();
  const a = articles.find(art => art.slug === slug);

  if (!a) {
    set('article-title', 'Article not found.');
    content.innerHTML = '<div class="blog-empty"><i class="bx bx-error-circle blog-empty-icon"></i><h3>Article not found</h3><p>This article may have moved. Head back to the <a href="blog.html">blog</a> to see everything we’ve published.</p></div>';
    return;
  }

  document.title = `${tr(a, 'title')} — Automate blog`;
  set('article-tag', tagLabel(a));
  set('article-date', metaDate(a));
  set('article-title', tr(a, 'title'));
  set('article-lead', tr(a, 'summary'));
  set('article-author-name', a.author ? `By ${a.author}` : '');

  const cover    = document.getElementById('article-cover');
  const coverImg = document.getElementById('article-cover-img');
  if (a.image_url && coverImg) {
    coverImg.src = a.image_url;
    coverImg.alt = tr(a, 'title');
    coverImg.style.display = 'block';
    if (cover) cover.classList.add(`blog-img-${a.category}`);
  } else if (cover) {
    cover.style.display = 'none';
  }

  content.innerHTML = tr(a, 'content') || '';
}

/* ── auto-detect page ── */
if (document.getElementById('blog-grid'))     initBlog();
if (document.getElementById('article-title')) initArticle();

/* ── re-render blog/article when the language switcher changes language
   (fired by i18n.js). Articles are cached, so this is instant. ── */
document.addEventListener('langchange', function () {
  if (document.getElementById('blog-grid'))     initBlog();
  if (document.getElementById('article-title')) initArticle();
});
