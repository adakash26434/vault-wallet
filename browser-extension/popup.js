const VAULT_URL = 'https://digital-life-vault--eprabhupokhara.replit.app';

// ── DOM helpers ───────────────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);
const msg = (data) => new Promise((res) => chrome.runtime.sendMessage(data, res));

function showView(name) {
  ['view-auth','view-totp','view-main'].forEach(v =>
    $(v).classList.toggle('hidden', v !== name)
  );
}

function setError(elId, text) {
  const el = $(elId);
  el.textContent = text;
  el.classList.remove('hidden');
}
function clearError(elId) { $(elId).classList.add('hidden'); }

function showToast(text, isErr = false) {
  const t = $('kw-toast');
  t.textContent = text;
  t.className = isErr ? 'show err' : 'show';
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show', 'err'), 2800);
}

// ── State ─────────────────────────────────────────────────────────────────────
let tempToken = null;
let allPasswords = [];
let currentSort = 'popular';
let searchQ = '';

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  // Set vault links
  $('link-vault-auth').href = VAULT_URL;
  $('link-vault-main').href = VAULT_URL + '/vault/passwords';

  const state = await msg({ type: 'GET_AUTH_STATE' });
  if (state?.isLoggedIn) {
    $('user-tag').textContent = state.userName || state.userEmail || 'Vault';
    showView('view-main');
    await loadPasswords();
  } else {
    showView('view-auth');
    $('auth-email').focus();
  }
}

// ── Login ─────────────────────────────────────────────────────────────────────
$('btn-login').addEventListener('click', doLogin);
$('auth-pass').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
$('auth-email').addEventListener('keydown', (e) => { if (e.key === 'Enter') $('auth-pass').focus(); });

async function doLogin() {
  clearError('auth-err');
  const email = $('auth-email').value.trim();
  const pass = $('auth-pass').value;
  if (!email || !pass) { setError('auth-err', 'Email ra password halunus'); return; }

  $('btn-login').disabled = true;
  $('btn-login').textContent = 'Signing in…';

  const res = await msg({ type: 'LOGIN', email, password: pass });

  $('btn-login').disabled = false;
  $('btn-login').textContent = 'Sign In →';

  if (res?.error) {
    setError('auth-err', res.error);
  } else if (res?.requires2FA) {
    tempToken = res.tempToken;
    showView('view-totp');
    $('totp-code').focus();
  } else if (res?.token) {
    await init();
  }
}

// ── TOTP ──────────────────────────────────────────────────────────────────────
$('btn-verify').addEventListener('click', doVerify);
$('btn-back').addEventListener('click', () => { tempToken = null; showView('view-auth'); });
$('totp-code').addEventListener('input', (e) => {
  e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  clearError('totp-err');
  if (e.target.value.length === 6) doVerify();
});

async function doVerify() {
  clearError('totp-err');
  const code = $('totp-code').value.trim();
  if (code.length !== 6) { setError('totp-err', '6-digit code halunus'); return; }

  $('btn-verify').disabled = true;
  $('btn-verify').textContent = 'Verifying…';

  const res = await msg({ type: 'VERIFY_TOTP', tempToken, code });

  $('btn-verify').disabled = false;
  $('btn-verify').textContent = 'Verify Code';

  if (res?.error) {
    setError('totp-err', res.error);
    $('totp-code').value = '';
    $('totp-code').focus();
  } else if (res?.token) {
    await init();
  }
}

// ── Logout ────────────────────────────────────────────────────────────────────
$('btn-logout').addEventListener('click', async () => {
  await msg({ type: 'LOGOUT' });
  allPasswords = [];
  $('pwd-list').innerHTML = '';
  $('auth-email').value = '';
  $('auth-pass').value = '';
  showView('view-auth');
  $('auth-email').focus();
});

// ── Load passwords ────────────────────────────────────────────────────────────
async function loadPasswords() {
  $('pwd-list').innerHTML = '<div class="state-box"><div class="spinner"></div><p>Loading…</p></div>';
  const res = await msg({ type: 'GET_PASSWORDS' });
  if (res?.error) {
    $('pwd-list').innerHTML = `<div class="state-box"><p>${esc(res.error)}</p></div>`;
    return;
  }
  allPasswords = res?.passwords || [];
  renderList();
}

// ── Render list ───────────────────────────────────────────────────────────────
const COLORS = ['#0078D4','#22C55E','#8B5CF6','#F59E0B','#EF4444','#EC4899','#06B6D4','#F97316'];
function pickColor(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % COLORS.length;
  return COLORS[Math.abs(h)];
}
function getDomain(url) {
  if (!url) return null;
  try { return new URL(url.startsWith('http') ? url : `https://${url}`).hostname; } catch { return null; }
}
function strClass(label) {
  const m = { weak:'s-weak', fair:'s-fair', strong:'s-strong', 'very-strong':'s-very-strong' };
  return m[label] ?? 's-fair';
}
function esc(s) {
  return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function sorted(list) {
  let l = [...list];
  if (searchQ) {
    const q = searchQ.toLowerCase();
    l = l.filter(p =>
      p.title?.toLowerCase().includes(q) ||
      p.username?.toLowerCase().includes(q) ||
      p.url?.toLowerCase().includes(q)
    );
  }
  if (currentSort === 'az') l.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === 'recent') l.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return l;
}

function renderList() {
  const listEl = $('pwd-list');
  const items = sorted(allPasswords);

  if (items.length === 0) {
    listEl.innerHTML = searchQ
      ? `<div class="state-box"><p>No results for "${esc(searchQ)}"</p><small>Try a different keyword</small></div>`
      : `<div class="state-box"><p>No passwords saved yet</p><small>Click "Add New" to save your first one</small></div>`;
    return;
  }

  listEl.innerHTML = items.map(p => {
    const domain = getDomain(p.url);
    const color = pickColor(p.title);
    const initial = (p.title?.[0] ?? '?').toUpperCase();
    const sc = strClass(p.strengthLabel);
    const uEsc = esc(p.username ?? '');
    const pEsc = esc(p.password ?? '');
    const tEsc = esc(p.title ?? '');

    return `
      <div class="pwd-item" data-u="${uEsc}" data-p="${pEsc}" data-t="${tEsc}">
        <div class="pwd-fav" style="background:${color}18">
          ${domain
            ? `<img src="https://www.google.com/s2/favicons?domain=${domain}&sz=32" alt="" onerror="this.style.display='none';this.nextElementSibling.style.cssText='display:flex;background:${color}'" /><div class="pwd-ini" style="display:none;font-size:13px;font-weight:700;color:white">${initial}</div>`
            : `<div class="pwd-ini" style="display:flex;background:${color}">${initial}</div>`
          }
        </div>
        <div class="pwd-info">
          <div class="pwd-title">${tEsc}</div>
          <div class="pwd-user">${esc(p.username || p.url || '—')}</div>
        </div>
        <div class="s-dot ${sc}" title="${esc(p.strengthLabel ?? 'unknown')}"></div>
        <div class="pwd-actions">
          <button class="act-btn act-fill" data-act="fill" title="Fill on this page">Fill</button>
          <button class="act-btn" data-act="copy-p" title="Copy password">Copy</button>
          <button class="act-btn" data-act="copy-u" title="Copy username">User</button>
        </div>
      </div>`;
  }).join('');

  listEl.addEventListener('click', onItemClick);
}

// Event delegation
let listBound = false;
function onItemClick(e) {
  const btn = e.target.closest('[data-act]');
  const item = e.target.closest('.pwd-item');
  if (!item) return;

  const u = item.dataset.u;
  const p = item.dataset.p;
  const t = item.dataset.t;

  if (btn?.dataset.act === 'fill') { doFill(u, p, t); }
  else if (btn?.dataset.act === 'copy-p') { doCopy(p, t + ' — password'); }
  else if (btn?.dataset.act === 'copy-u') { doCopy(u, t + ' — username'); }
  else if (!btn) { doFill(u, p, t); }
}

// ── Fill ──────────────────────────────────────────────────────────────────────
async function doFill(username, password, title) {
  const res = await msg({ type: 'FILL_CREDENTIALS', username, password });
  if (res?.filled) {
    showToast(`✓ Filled ${title}`);
    setTimeout(() => window.close(), 600);
  } else {
    showToast('No login form found on this page', true);
  }
}

$('btn-fill').addEventListener('click', async () => {
  const res = await msg({ type: 'FILL_BEST_MATCH' });
  if (res?.filled) {
    showToast(`✓ Filled ${res.title ?? 'credentials'}`);
    setTimeout(() => window.close(), 600);
  } else if (allPasswords.length === 0) {
    showToast('No passwords saved yet', true);
  } else {
    showToast('No matching login found for this page', true);
  }
});

$('btn-add').addEventListener('click', () => {
  chrome.tabs.create({ url: VAULT_URL + '/vault/passwords' });
  window.close();
});

// ── Copy ──────────────────────────────────────────────────────────────────────
async function doCopy(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(`✓ ${label} copied — clears in 30s`);
    setTimeout(() => navigator.clipboard.writeText('').catch(() => {}), 30000);
  } catch {
    showToast('Could not copy to clipboard', true);
  }
}

// ── Search ────────────────────────────────────────────────────────────────────
$('search-input').addEventListener('input', (e) => {
  searchQ = e.target.value.trim();
  $('btn-clear').classList.toggle('hidden', !searchQ);
  renderList();
});
$('btn-clear').addEventListener('click', () => {
  $('search-input').value = '';
  searchQ = '';
  $('btn-clear').classList.add('hidden');
  $('search-input').focus();
  renderList();
});

// ── Sort tabs ─────────────────────────────────────────────────────────────────
document.querySelectorAll('.stab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.stab').forEach(t => t.classList.remove('on'));
    tab.classList.add('on');
    currentSort = tab.dataset.sort;
    renderList();
  });
});

// ── Boot ──────────────────────────────────────────────────────────────────────
init();
