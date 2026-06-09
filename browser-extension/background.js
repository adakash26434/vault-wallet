const API_BASE = 'https://digital-life-vault--eprabhupokhara.replit.app';

// ── Storage helpers ───────────────────────────────────────────────────────────
async function getAuth() {
  return chrome.storage.local.get(['kw_token', 'kw_user', 'kw_pending_email']);
}
async function setAuth(token, user) {
  await chrome.storage.local.set({ kw_token: token, kw_user: user });
}
async function clearAuth() {
  await chrome.storage.local.remove(['kw_token', 'kw_user', 'kw_pending_email']);
}

// ── JWT decode (client-side, no signature verify needed here) ─────────────────
function decodeJWT(token) {
  try {
    const payload = atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(payload);
  } catch { return null; }
}

// ── API helper ────────────────────────────────────────────────────────────────
async function api(path, opts = {}) {
  const { kw_token } = await chrome.storage.local.get('kw_token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  if (kw_token) headers['Authorization'] = `Bearer ${kw_token}`;

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...opts, headers });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { error: data.error || data.message || `HTTP ${res.status}` };
    return data;
  } catch {
    return { error: 'Network error — check connection and try again.' };
  }
}

// ── Message handler ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
  handle(msg).then(reply);
  return true;
});

async function handle(msg) {
  switch (msg.type) {

    case 'GET_AUTH_STATE': {
      const { kw_token, kw_user } = await getAuth();
      if (!kw_token) return { isLoggedIn: false };
      const payload = decodeJWT(kw_token);
      const exp = payload?.exp ? payload.exp * 1000 : Infinity;
      if (Date.now() > exp) { await clearAuth(); return { isLoggedIn: false }; }
      return { isLoggedIn: true, userName: kw_user?.name, userEmail: kw_user?.email };
    }

    case 'LOGIN': {
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: msg.email, password: msg.password }),
      });
      if (res.error) return res;
      if (res.token) {
        const payload = decodeJWT(res.token);
        await setAuth(res.token, { email: msg.email, name: payload?.name });
      }
      if (res.requires2FA) {
        await chrome.storage.local.set({ kw_pending_email: msg.email });
      }
      return res;
    }

    case 'VERIFY_TOTP': {
      const res = await api('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ tempToken: msg.tempToken, token: msg.code }),
      });
      if (res.error) return res;
      if (res.token) {
        const { kw_pending_email } = await chrome.storage.local.get('kw_pending_email');
        const payload = decodeJWT(res.token);
        await setAuth(res.token, { email: kw_pending_email || '', name: payload?.name });
        await chrome.storage.local.remove('kw_pending_email');
      }
      return res;
    }

    case 'LOGOUT': {
      await clearAuth();
      return { success: true };
    }

    case 'GET_PASSWORDS': {
      const params = msg.search ? `?search=${encodeURIComponent(msg.search)}` : '';
      const res = await api(`/api/passwords${params}`);
      if (res.error) return res;
      return { passwords: Array.isArray(res) ? res : [] };
    }

    case 'SAVE_PASSWORD': {
      return api('/api/passwords', {
        method: 'POST',
        body: JSON.stringify(msg.data),
      });
    }

    case 'CHECK_CURRENT_TAB': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) {
          return { hasPasswordField: false };
        }
        const res = await chrome.tabs.sendMessage(tab.id, { type: 'CHECK_FORM' }).catch(() => null);
        return res || { hasPasswordField: false };
      } catch { return { hasPasswordField: false }; }
    }

    case 'FILL_CREDENTIALS': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id) return { filled: false };
        const res = await chrome.tabs.sendMessage(tab.id, {
          type: 'FILL_FORM', username: msg.username, password: msg.password,
        }).catch(() => null);
        return res || { filled: false };
      } catch { return { filled: false }; }
    }

    case 'FILL_BEST_MATCH': {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (!tab?.id || !tab.url) return { filled: false };
        let domain = '';
        try { domain = new URL(tab.url).hostname.replace(/^www\./, ''); } catch {}
        const pwdRes = await handle({ type: 'GET_PASSWORDS', search: domain });
        const passwords = pwdRes.passwords || [];
        if (!passwords.length) return { filled: false };
        const best = passwords[0];
        const res = await chrome.tabs.sendMessage(tab.id, {
          type: 'FILL_FORM', username: best.username || '', password: best.password || '',
        }).catch(() => null);
        return { ...(res || {}), title: best.title };
      } catch { return { filled: false }; }
    }

    case 'STORE_PENDING_SAVE': {
      await chrome.storage.local.set({
        kw_pending_save: { url: msg.url, title: msg.title, username: msg.username, password: msg.password, ts: Date.now() },
      });
      return { stored: true };
    }

    case 'GET_PENDING_SAVE': {
      const { kw_pending_save } = await chrome.storage.local.get('kw_pending_save');
      await chrome.storage.local.remove('kw_pending_save');
      if (!kw_pending_save) return null;
      // Only valid for 30 seconds
      if (Date.now() - kw_pending_save.ts > 30000) return null;
      return kw_pending_save;
    }

    case 'SAVE_CAPTURED': {
      return handle({
        type: 'SAVE_PASSWORD',
        data: { title: msg.title, username: msg.username, password: msg.password, url: msg.url },
      });
    }

    default:
      return { error: 'Unknown message type: ' + msg.type };
  }
}
