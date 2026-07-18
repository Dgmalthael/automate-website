/* ═══════════════════════════════════════════════════════════
   AUTOMATE — translate.gs
   ───────────────────────────────────────────────────────────
   Auto-translates blog articles straight into the "Articles"
   sheet — no copy-paste. Two engines:

     • GOOGLE  — free, no API key, built into Apps Script.
                 Default for the checkbox. Good for everyday posts.
     • CLAUDE  — best tone/quality (needs ANTHROPIC_API_KEY, a few
                 cents/article). Use for important posts / the backlog.

   Both preserve your HTML tags.

   WORKFLOW
     1. Write a new article row: fill only the ENGLISH fields
        (slug, title, summary, content, date, category, image_url…).
     2. Tick the "translate" checkbox on that row.
        → fills title_fr/summary_fr/content_fr, _es, _it, _tr.
        Uses GOOGLE by default; put "claude" in the row's optional
        "engine" cell to use Claude for that row instead.
     3. Review, tweak if you like. The site serves them automatically.

   Backlog: menu 🌍 Translate → "Translate all (Google)" or "(Claude)".

   ONE-TIME SETUP — see checklist at the bottom of this file.
   ═══════════════════════════════════════════════════════════ */

const SHEET_NAME   = 'Articles';
const DEFAULT_ENGINE = 'google';          // engine the checkbox uses when the row's "engine" cell is blank
const CLAUDE_MODEL = 'claude-opus-4-8';   // ← 'claude-haiku-4-5' for ~5× cheaper Claude
const FIELDS = ['title', 'summary', 'content'];             // fields that get translated
const LANGS  = { de: 'German', fr: 'French', es: 'Spanish', it: 'Italian', tr: 'Turkish' };

/* ── sheet menu ── */
function onOpen() {
  SpreadsheetApp.getUi().createMenu('🌍 Translate')
    .addItem('Translate all untranslated rows (Google — free)', 'translateAllGoogle')
    .addItem('Translate all untranslated rows (Claude — best)', 'translateAllClaude')
    .addSeparator()
    .addItem('1 · Set up columns + checkbox', 'setup')
    .addItem('2 · Enable auto-translate trigger', 'createTrigger')
    .addToUi();
}

/* ── header helpers (headers are normalised: lowercase, spaces→underscores) ── */
function sheet_() { return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME); }
function headerRow_(sh) {
  return sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
           .map(function (h) { return String(h).trim().toLowerCase().replace(/\s+/g, '_'); });
}
function col_(headers, name) { return headers.indexOf(name) + 1; } // 1-based, 0 = missing

/* ════════════════════════════════════════════════════════════
   ENGINE 1 — Google Translate (free, built in, HTML-safe)
   Translates one field at a time; no token limits, no key.
   ════════════════════════════════════════════════════════════ */
function googleTranslate_(text, langCode) {
  if (!String(text).trim()) return '';
  // contentType:'html' keeps tags/attributes intact, translates only text nodes
  return LanguageApp.translate(text, 'en', langCode, { contentType: 'html' });
}

/* ════════════════════════════════════════════════════════════
   ENGINE 2 — Claude (best quality). Translates a {field:text}
   object into one language in a single call.
   ════════════════════════════════════════════════════════════ */
function claudeTranslate_(fields, targetName) {
  const key = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!key) throw new Error('Set ANTHROPIC_API_KEY in Script Properties (Project Settings) to use the Claude engine.');

  const system =
    'You are a professional translator for a B2B AI-automation company blog. ' +
    'Translate the VALUES of the given JSON object into ' + targetName + '. ' +
    'Rules: preserve ALL HTML tags, attributes and structure exactly — translate only the human-readable text between tags. ' +
    'Keep a natural, confident marketing tone. Do NOT translate code, URLs, or the brand names "Automate" and "Claude". ' +
    'Return ONLY a JSON object with the SAME keys and translated values — no preamble, no explanation, no markdown fences.';

  const payload = {
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: system,
    messages: [{ role: 'user', content: JSON.stringify(fields) }]
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });

  const code = res.getResponseCode();
  if (code !== 200) throw new Error('Claude API ' + code + ': ' + res.getContentText());

  const body = JSON.parse(res.getContentText());
  let text = (body.content || []).map(function (b) { return b.type === 'text' ? b.text : ''; }).join('').trim();
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, ''); // strip stray fences
  return JSON.parse(text);
}

/* ════════════════════════════════════════════════════════════
   Translate a single row — only fills EMPTY target cells (idempotent,
   so re-running is safe and never clobbers your manual edits).
   `engineOverride` (from menu) wins; else the row's "engine" cell;
   else DEFAULT_ENGINE.
   ════════════════════════════════════════════════════════════ */
function translateRow_(sh, headers, row, engineOverride) {
  const get = function (name) { const c = col_(headers, name); return c ? sh.getRange(row, c).getValue() : ''; };
  const en  = { title: get('title'), summary: get('summary'), content: get('content') };
  if (!String(en.content).trim() && !String(en.title).trim()) return; // blank row

  const rowEngine = String(get('engine')).trim().toLowerCase();
  const engine = (engineOverride || rowEngine || DEFAULT_ENGINE);

  Object.keys(LANGS).forEach(function (langCode) {
    // which fields still need translating in this language?
    const need = [];
    FIELDS.forEach(function (f) {
      const tc = col_(headers, f + '_' + langCode);
      const hasSource = String(en[f] || '').trim() !== '';
      const emptyDest = tc && String(sh.getRange(row, tc).getValue()).trim() === '';
      if (hasSource && emptyDest) need.push(f);
    });
    if (!need.length) return;

    if (engine === 'claude') {
      const input = {};
      need.forEach(function (f) { input[f] = en[f]; });
      const out = claudeTranslate_(input, LANGS[langCode]);
      need.forEach(function (f) {
        const tc = col_(headers, f + '_' + langCode);
        if (tc && out[f] != null) sh.getRange(row, tc).setValue(out[f]);
      });
    } else { // google (default)
      need.forEach(function (f) {
        const tc = col_(headers, f + '_' + langCode);
        if (tc) sh.getRange(row, tc).setValue(googleTranslate_(en[f], langCode));
      });
    }
  });

  const tcol = col_(headers, 'translate');       // uncheck when finished
  if (tcol) sh.getRange(row, tcol).setValue(false);
}

/* ── backlog runners ── */
function translateAllGoogle() { translateAll_('google'); }
function translateAllClaude() { translateAll_('claude'); }
function translateAll_(engine) {
  const sh = sheet_();
  const headers = headerRow_(sh);
  const last = sh.getLastRow();
  for (var r = 2; r <= last; r++) translateRow_(sh, headers, r, engine);
  SpreadsheetApp.getActive().toast('Translation pass complete (' + engine + ').');
  // Apps Script caps a run at ~6 min. With many long articles just run again —
  // it resumes on the still-empty cells only.
}

/* ════════════════════════════════════════════════════════════
   Auto-trigger — fires when a "translate" checkbox is ticked.
   Installable (Google's LanguageApp and Claude's UrlFetchApp both
   need authorisation a simple onEdit trigger can't grant).
   ════════════════════════════════════════════════════════════ */
function onEditInstallable(e) {
  const sh = e.range.getSheet();
  if (sh.getName() !== SHEET_NAME) return;

  const headers = headerRow_(sh);
  const tcol = col_(headers, 'translate');
  if (!tcol || e.range.getColumn() !== tcol) return; // only the translate column

  const start = e.range.getRow(), n = e.range.getNumRows();
  for (var i = 0; i < n; i++) {
    if (sh.getRange(start + i, tcol).getValue() === true) {
      translateRow_(sh, headers, start + i); // engine = row's "engine" cell or DEFAULT_ENGINE
    }
  }
}

/* ════════════════════════════════════════════════════════════
   One-time setup helpers
   ════════════════════════════════════════════════════════════ */
function setup() {
  const sh = sheet_();
  const headers = headerRow_(sh);
  const add = function (name) { if (headers.indexOf(name) === -1) { sh.getRange(1, sh.getLastColumn() + 1).setValue(name); headers.push(name); } };

  FIELDS.forEach(function (f) { Object.keys(LANGS).forEach(function (l) { add(f + '_' + l); }); });
  add('engine');      // optional per-row override: blank = Google, or type "claude"
  add('translate');   // the checkbox column

  const tcol = col_(headers, 'translate');
  const last = Math.max(sh.getLastRow(), 2);
  sh.getRange(2, tcol, last - 1, 1).insertCheckboxes();

  SpreadsheetApp.getActive().toast('Columns ready. Next: run createTrigger(), then 🌍 Translate → Translate all.');
}

function createTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'onEditInstallable') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('onEditInstallable')
    .forSpreadsheet(SpreadsheetApp.getActiveSpreadsheet())
    .onEdit()
    .create();
  SpreadsheetApp.getActive().toast('Auto-translate trigger enabled. Tick a "translate" box to test.');
}

/* ═══════════════════════════════════════════════════════════
   SETUP CHECKLIST
   ───────────────────────────────────────────────────────────
   1. Extensions → Apps Script. Paste this file.
   2. (Only if you'll use the Claude engine) Project Settings (gear) →
      Script Properties → Add:  ANTHROPIC_API_KEY = sk-ant-...
      Google needs no key.
   3. Run  setup()         → creates the language columns + checkboxes.
   4. Run  createTrigger() → wires the checkbox (approve the auth prompt).
   5. Reload the sheet.
        • Future posts: tick a row's "translate" box → Google fills it (free).
          (Put "claude" in that row's "engine" cell for Claude instead.)
        • Existing backlog: 🌍 Translate → "Translate all (Claude — best)".
   ═══════════════════════════════════════════════════════════ */
