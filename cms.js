/* ═══════════════════════════════════════════════════════════
   GOOGLE SHEETS CMS  —  Apps Script backend
   ───────────────────────────────────────────────────────────

   STEP 1 — Add this function to your existing Apps Script
   ─────────────────────────────────────────────────────────
   In your Google Sheet: Extensions → Apps Script
   Paste this alongside your existing doPost contact-form code:

   function doGet(e) {
     const sheet = SpreadsheetApp
       .getActiveSpreadsheet()
       .getSheetByName('Articles');
     if (!sheet) return jsonResponse([]);
     const [headers, ...rows] = sheet.getDataRange().getValues();
     const keys = headers.map(h =>
       String(h).toLowerCase().trim().replace(/\s+/g, '_'));
     const articles = rows
       .map(row => Object.fromEntries(keys.map((k, i) => [k, row[i] ?? ''])))
       .filter(a => a.slug);
     return jsonResponse(articles);
   }
   function jsonResponse(data) {
     return ContentService
       .createTextOutput(JSON.stringify(data))
       .setMimeType(ContentService.MimeType.JSON);
   }

   STEP 2 — Redeploy
   ──────────────────
   Deploy → Manage deployments → select your existing deployment → Edit (pencil)
   → Version: New version → Deploy
   (same URL, no need to update anything in the site)

   STEP 3 — Create the Articles sheet tab
   ───────────────────────────────────────
   Add a new tab named exactly:  Articles
   Row 1 must be these headers (copy-paste this row):

   slug  title  date  read_time  category  category_label  summary  author  spotlight  content

   Column guide:
   slug          → URL identifier, lowercase-hyphenated   e.g.  invoice-automation-stack
   title         → Full article title
   date          → Display date                           e.g.  Mar 2025
   read_time     → Read time                              e.g.  8 min read
   category      → One of: automation | generative-ai | guides | industry
   category_label→ Label shown on the card                e.g.  Automation
   summary       → 1–2 sentence description for the card
   author        → Full author name                       e.g.  Sofia Reyes
   spotlight     → TRUE for a full-width spotlight card   (leave blank for regular)
   content       → Full article body as HTML
                   Wrap text in:  <p>  <h2>  <h3>  <ul>  <li>  <strong>
                   Tip: write the HTML in a text editor, then paste into the cell.
                   In Sheets, press Ctrl+Enter to add line breaks inside a cell.

   STEP 4 — Paste your existing Web App URL below
   ════════════════════════════════════════════════════════════ */

const CMS_URL = 'https://script.google.com/macros/s/AKfycbwxsoDf2PAlgyDQ-khyeJyQm9h24CQYNUzliQ7zP9giIWdlTJo6onARhT35tnd-5HiE3Q/exec';

/* ── fetch all articles from Apps Script ── */
async function fetchArticles() {
  try {
    const res  = await fetch(CMS_URL);
    const data = await res.json();
    return Array.isArray(data) ? data.filter(a => a.slug) : [];
  } catch (err) {
    console.error('[CMS] Could not load articles:', err);
    return [];
  }
}

function firstLetter(name) {
  return String(name).trim().charAt(0).toUpperCase() || '?';
}

function formatDate(raw) {
  const d = new Date(raw);
  if (isNaN(d)) return String(raw); // fallback: use as-is
  return d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
}

/* ════════════════════════════════════════════════════════════
   BLOG PAGE  —  renders article grid from sheet data
   ════════════════════════════════════════════════════════════ */
async function initBlog() {
  const grid = document.getElementById('blog-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="cms-loading" id="cms-loading">
      <i class='bx bx-loader-alt cms-spinner'></i>
      <span>Loading articles…</span>
    </div>`;

  const articles = await fetchArticles();
  grid.innerHTML = '';

  if (!articles.length) {
    grid.innerHTML = `
      <div class="blog-empty">
        <i class='bx bx-edit-alt blog-empty-icon'></i>
        <h3>Articles Coming Soon</h3>
        <p>The first articles are being prepared. Check back shortly.</p>
      </div>`;
    return;
  }

  articles.forEach(a => {
    const url = `article.html?slug=${encodeURIComponent(a.slug)}`;

    if (String(a.spotlight).toUpperCase() === 'TRUE') {
      const el = document.createElement('article');
      el.className = 'blog-card-spotlight';
      el.dataset.category = a.category;
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => { if (!e.target.closest('a, button')) location.href = url; });
      el.innerHTML = `
        <div class="spotlight-img blog-img-${a.category}">
          ${a.image_url ? `<img src="${a.image_url}" alt="${a.title}" class="blog-card-cover-img">` : ''}
        </div>
        <div class="spotlight-body">
          <div class="spotlight-meta">
            <span class="article-tag">Spotlight</span>
            <span class="mono-tag article-date">${formatDate(a.date)}</span>
          </div>
          <h2>${a.title}</h2>
          <p>${a.summary}</p>
          <div class="article-author" style="margin-top:1.5rem">
            <span class="author-name">${a.author}</span>
          </div>
          <a href="${url}" class="link-reset">
            <button class="btn-learn-more" style="margin-top:1.5rem">Read Full Article →</button>
          </a>
        </div>`;
      grid.appendChild(el);
    } else {
      const el = document.createElement('article');
      el.className = 'blog-card';
      el.dataset.category = a.category;
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => { if (!e.target.closest('a, button')) location.href = url; });
      el.innerHTML = `
        <div class="blog-card-img blog-img-${a.category}">
          ${a.image_url ? `<img src="${a.image_url}" alt="${a.title}" class="blog-card-cover-img">` : ''}
          <span class="article-tag">${a.category_label}</span>
        </div>
        <div class="blog-card-body">
          <span class="mono-tag article-date">${formatDate(a.date)} · ${a.read_time}</span>
          <h3>${a.title}</h3>
          <p>${a.summary}</p>
          <div class="article-author" style="margin-top:auto;padding-top:1rem">
            <span class="author-name">${a.author}</span>
          </div>
          <a href="${url}" class="link-reset">
            <button class="btn-item">Read Article →</button>
          </a>
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
   Every row in the sheet becomes its own URL:
   article.html?slug=your-article-slug
   ════════════════════════════════════════════════════════════ */
async function initArticle() {
  const slug = new URLSearchParams(window.location.search).get('slug');

  if (!slug) {
    document.getElementById('article-title').textContent = 'No article specified.';
    document.getElementById('article-content').innerHTML = '<p>Please return to the <a href="blog.html">blog</a> and select an article.</p>';
    return;
  }

  /* show loading state across all header fields + body */
  document.getElementById('article-tag').textContent         = '';
  document.getElementById('article-date').textContent        = '';
  document.getElementById('article-title').innerHTML         = '<span class="article-loading-title">Loading…</span>';
  document.getElementById('article-lead').textContent        = '';
  document.getElementById('article-author-name').textContent = '';
  document.getElementById('article-content').innerHTML = `
    <div class="cms-loading">
      <i class='bx bx-loader-alt cms-spinner'></i>
      <span>Loading article…</span>
    </div>`;

  const articles = await fetchArticles();
  const a = articles.find(art => art.slug === slug);

  if (!a) {
    document.getElementById('article-title').textContent = 'Article not found.';
    return;
  }

  document.title = `${a.title} — Automate Blog`;
  document.getElementById('article-tag').textContent          = a.category_label;
  document.getElementById('article-date').textContent         = `${formatDate(a.date)} · ${a.read_time}`;
  document.getElementById('article-title').textContent        = a.title;
  document.getElementById('article-lead').textContent         = a.summary;
  document.getElementById('article-author-name').textContent  = a.author;
  document.getElementById('article-cover').className          = `article-cover blog-img-${a.category} autoBlur`;
  if (a.image_url) {
    const img = document.getElementById('article-cover-img');
    img.src   = a.image_url;
    img.alt   = a.title;
    img.style.display = 'block';
  }
  document.getElementById('article-content').innerHTML        = a.content;
}

/* ── auto-detect page ── */
if (document.getElementById('blog-grid'))     initBlog();
if (document.getElementById('article-title')) initArticle();
