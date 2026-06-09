(function () {
  'use strict';
  if (window.__kwLoaded) return;
  window.__kwLoaded = true;

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function escAttr(s) {
    return String(s ?? '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function setVal(input, value) {
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
    if (setter) setter.call(input, value);
    else input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent('keyup', { bubbles: true }));
  }

  // ── Form detection ───────────────────────────────────────────────────────────
  function findUsernameFor(pwdInput) {
    const scope = pwdInput.closest('form') || document.body;
    const sel = 'input[type="email"],input[type="text"],input[autocomplete="username"],input[autocomplete="email"],input[name*="user" i],input[name*="email" i],input[name*="login" i],input[id*="user" i],input[id*="email" i]';
    let best = null;
    for (const el of scope.querySelectorAll(sel)) {
      if (el.compareDocumentPosition(pwdInput) & Node.DOCUMENT_POSITION_FOLLOWING) best = el;
    }
    return best;
  }

  let lastPwd = null, lastUser = null;

  // ── Fill button injection ────────────────────────────────────────────────────
  function inject(pwdInput) {
    if (pwdInput.dataset.kwDone) return;
    pwdInput.dataset.kwDone = '1';
    lastPwd = pwdInput;
    lastUser = findUsernameFor(pwdInput);

    const wrap = pwdInput.parentElement;
    const cs = getComputedStyle(wrap);
    if (cs.position === 'static') wrap.style.position = 'relative';

    const currentPR = parseInt(getComputedStyle(pwdInput).paddingRight) || 0;
    if (currentPR < 42) pwdInput.style.cssText += ';padding-right:40px!important';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.title = 'Fill with Key Wallet';
    btn.style.cssText = [
      'position:absolute', 'right:7px', 'top:50%', 'transform:translateY(-50%)',
      'width:26px', 'height:26px', 'padding:0', 'margin:0',
      'border:none', 'border-radius:6px', 'background:white',
      'box-shadow:0 1px 4px rgba(0,0,0,.18)', 'cursor:pointer',
      'display:flex', 'align-items:center', 'justify-content:center',
      'z-index:2147483640', 'transition:box-shadow .15s',
    ].join(';');
    btn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 2L4 6.5v5.5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6.5L12 2z" fill="#0078D4"/>
      <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    btn.addEventListener('mouseover', () => { btn.style.boxShadow = '0 2px 8px rgba(0,120,212,.35)'; });
    btn.addEventListener('mouseout', () => { btn.style.boxShadow = '0 1px 4px rgba(0,0,0,.18)'; });
    btn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openDropdown(btn, pwdInput); });
    wrap.appendChild(btn);
  }

  // ── Fill dropdown ────────────────────────────────────────────────────────────
  let dropEl = null;
  function closeDropdown() { dropEl?.remove(); dropEl = null; }

  function openDropdown(anchor, pwdInput) {
    closeDropdown();
    lastPwd = pwdInput;
    lastUser = findUsernameFor(pwdInput);

    const drop = document.createElement('div');
    drop.style.cssText = [
      'position:fixed', 'z-index:2147483647', 'background:white',
      'border:1.5px solid #E2E8F0', 'border-radius:10px',
      'box-shadow:0 8px 24px rgba(0,0,0,.14)', 'width:265px',
      'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif',
      'overflow:hidden', 'animation:kwFade .12s ease',
    ].join(';');

    const style = document.createElement('style');
    style.textContent = '@keyframes kwFade{from{opacity:0;transform:translateY(-4px)}to{opacity:1;transform:translateY(0)}}';
    document.head.appendChild(style);

    const rect = anchor.getBoundingClientRect();
    const left = Math.min(rect.right - 265, window.innerWidth - 275);
    drop.style.left = Math.max(5, left) + 'px';
    drop.style.top = (rect.bottom + 5) + 'px';

    drop.innerHTML = `
      <div style="padding:9px 12px 6px;border-bottom:1px solid #F1F5F9;display:flex;align-items:center;gap:7px">
        <svg width="13" height="13" viewBox="0 0 24 24"><path d="M12 2L4 6.5v5.5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6.5L12 2z" fill="#0078D4"/></svg>
        <span style="font-size:12px;font-weight:700;color:#1A202C">Key Wallet</span>
        <span style="font-size:11px;color:#94A3B8;margin-left:auto">${esc(window.location.hostname)}</span>
      </div>
      <div id="kw-list" style="padding:4px 0;max-height:210px;overflow-y:auto">
        <div style="padding:14px;text-align:center;color:#94A3B8;font-size:12px">Loading…</div>
      </div>`;

    document.body.appendChild(drop);
    dropEl = drop;

    const domain = window.location.hostname.replace(/^www\./, '');
    chrome.runtime.sendMessage({ type: 'GET_PASSWORDS', search: domain }, (res) => {
      const list = document.getElementById('kw-list');
      if (!list) return;
      const pwds = res?.passwords || [];

      if (!pwds.length) {
        list.innerHTML = `<div style="padding:14px 12px;text-align:center">
          <p style="font-size:12.5px;color:#64748B;margin-bottom:8px">No saved logins for this site</p>
          <div style="display:flex;gap:6px;justify-content:center">
            <button id="kw-open-all" style="height:28px;padding:0 10px;background:#EFF6FF;color:#0078D4;border:1px solid #BFDBFE;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer">View All</button>
          </div></div>`;
        document.getElementById('kw-open-all')?.addEventListener('click', () => {
          chrome.runtime.sendMessage({ type: 'OPEN_POPUP' });
          closeDropdown();
        });
        return;
      }

      const colors = ['#0078D4','#22C55E','#8B5CF6','#F59E0B','#EF4444'];
      list.innerHTML = pwds.slice(0, 6).map(p => {
        let hash = 0;
        for (const c of (p.title || '')) hash = (hash * 31 + c.charCodeAt(0)) % colors.length;
        const color = colors[Math.abs(hash)];
        const initial = (p.title?.[0] ?? '?').toUpperCase();
        let domainStr = null;
        try { domainStr = new URL(p.url?.startsWith('http') ? p.url : `https://${p.url}`).hostname; } catch {}
        return `
          <div class="kw-opt" data-u="${escAttr(p.username ?? '')}" data-p="${escAttr(p.password ?? '')}"
               style="display:flex;align-items:center;gap:9px;padding:7px 12px;cursor:pointer">
            <div style="width:30px;height:30px;border-radius:7px;background:${color}18;display:flex;align-items:center;justify-content:center;flex-shrink:0;overflow:hidden">
              ${domainStr
                ? `<img src="https://www.google.com/s2/favicons?domain=${domainStr}&sz=28" style="width:18px;height:18px;object-fit:contain" onerror="this.parentElement.innerHTML='<span style=font-size:12px;font-weight:700;color:${color}>${initial}</span>'">`
                : `<span style="font-size:12px;font-weight:700;color:${color}">${initial}</span>`}
            </div>
            <div style="flex:1;min-width:0">
              <p style="font-size:13px;font-weight:600;color:#1A202C;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.title)}</p>
              <p style="font-size:11px;color:#64748B;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(p.username || '—')}</p>
            </div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" stroke-width="2.5"><path d="m9 18 6-6-6-6"/></svg>
          </div>`;
      }).join('');

      list.querySelectorAll('.kw-opt').forEach(el => {
        el.addEventListener('mouseover', () => { el.style.background = '#F8FAFC'; });
        el.addEventListener('mouseout', () => { el.style.background = ''; });
        el.addEventListener('click', () => {
          fillForm(el.dataset.u, el.dataset.p);
          closeDropdown();
        });
      });
    });

    setTimeout(() => {
      document.addEventListener('click', (e) => {
        if (!drop.contains(e.target)) closeDropdown();
      }, { once: true });
    }, 50);
  }

  // ── Fill ─────────────────────────────────────────────────────────────────────
  function fillForm(username, password) {
    if (lastUser && username) { setVal(lastUser, username); lastUser.focus(); }
    if (lastPwd && password) { setVal(lastPwd, password); }
    if (lastPwd) lastPwd.focus();
  }

  // ── Save bar (RoboForm-style top bar) ────────────────────────────────────────
  let saveBarVisible = false;

  function showSaveBar(url, title, username, password) {
    if (saveBarVisible || document.getElementById('kw-save-bar')) return;
    saveBarVisible = true;

    const style = document.createElement('style');
    style.textContent = `@keyframes kwSlide{from{transform:translateY(-100%);opacity:0}to{transform:translateY(0);opacity:1}}
      #kw-save-bar *{box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif!important}`;
    document.head.appendChild(style);

    const bar = document.createElement('div');
    bar.id = 'kw-save-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;background:white;border-bottom:2.5px solid #0078D4;box-shadow:0 3px 14px rgba(0,0,0,.12);animation:kwSlide .22s ease';

    let shortHost = '';
    try { shortHost = new URL(url).hostname; } catch { shortHost = url; }

    bar.innerHTML = `
      <div style="max-width:700px;margin:0 auto;padding:9px 16px;display:flex;align-items:center;gap:12px">
        <svg width="18" height="18" viewBox="0 0 24 24" flex-shrink="0" style="flex-shrink:0">
          <path d="M12 2L4 6.5v5.5c0 5.25 3.5 10.15 8 11.35C16.5 22.15 20 17.25 20 12V6.5L12 2z" fill="#0078D4"/>
          <path d="M9 12l2 2 4-4" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <div style="flex:1;min-width:0">
          <p style="font-size:13.5px;font-weight:700;color:#1A202C;margin:0">Save to Key Wallet?</p>
          <p style="font-size:12px;color:#64748B;margin:0;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
            <strong style="color:#1A202C">${esc(title || shortHost)}</strong>${username ? ` &mdash; ${esc(username)}` : ''}
          </p>
        </div>
        <div style="display:flex;gap:7px;flex-shrink:0;align-items:center">
          <button id="kw-do-save" style="height:31px;padding:0 14px;background:#0078D4;color:white;border:none;border-radius:7px;font-size:13px;font-weight:600;cursor:pointer;transition:background .15s">Save</button>
          <button id="kw-no-save" style="height:31px;padding:0 12px;background:white;color:#64748B;border:1.5px solid #E2E8F0;border-radius:7px;font-size:13px;cursor:pointer;transition:border-color .15s">Not Now</button>
          <button id="kw-x-save" style="width:26px;height:26px;border:none;background:none;cursor:pointer;color:#94A3B8;font-size:20px;line-height:1;padding:0;display:flex;align-items:center;justify-content:center">&times;</button>
        </div>
      </div>`;

    document.body.prepend(bar);

    const dismiss = () => {
      bar.style.transform = 'translateY(-100%)';
      bar.style.opacity = '0';
      bar.style.transition = 'transform .2s ease,opacity .2s ease';
      setTimeout(() => { bar.remove(); saveBarVisible = false; }, 220);
    };

    document.getElementById('kw-do-save').addEventListener('click', () => {
      const saveBtn = document.getElementById('kw-do-save');
      if (!saveBtn) return;
      saveBtn.textContent = 'Saving…';
      saveBtn.disabled = true;
      chrome.runtime.sendMessage({ type: 'SAVE_CAPTURED', url, title: title || shortHost, username, password }, (res) => {
        const b = document.getElementById('kw-do-save');
        if (!b) return;
        if (res?.error) {
          b.textContent = 'Error!';
          b.style.background = '#EF4444';
          setTimeout(dismiss, 2000);
        } else {
          b.textContent = 'Saved ✓';
          b.style.background = '#22C55E';
          setTimeout(dismiss, 1500);
        }
      });
    });

    document.getElementById('kw-no-save').addEventListener('click', dismiss);
    document.getElementById('kw-x-save').addEventListener('click', dismiss);
    setTimeout(dismiss, 22000);
  }

  // ── Form submit capture ──────────────────────────────────────────────────────
  function watchForms() {
    document.querySelectorAll('form').forEach(form => {
      if (form.dataset.kwWatch) return;
      form.dataset.kwWatch = '1';
      form.addEventListener('submit', () => {
        const pwdInput = form.querySelector('input[type="password"]');
        if (!pwdInput?.value) return;
        const userInput = findUsernameFor(pwdInput);
        const creds = {
          url: window.location.href,
          title: document.title || window.location.hostname,
          username: userInput?.value || '',
          password: pwdInput.value,
        };
        chrome.runtime.sendMessage({ type: 'STORE_PENDING_SAVE', ...creds });
        // Also try to show immediately (for SPA forms)
        setTimeout(() => showSaveBar(creds.url, creds.title, creds.username, creds.password), 800);
      }, true);
    });
  }

  // ── Message listener ─────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, reply) => {
    if (msg.type === 'CHECK_FORM') {
      reply({ hasPasswordField: !!document.querySelector('input[type="password"]') });
      return true;
    }
    if (msg.type === 'FILL_FORM') {
      const pwds = document.querySelectorAll('input[type="password"]');
      if (!pwds.length) { reply({ filled: false }); return true; }
      lastPwd = pwds[0];
      lastUser = findUsernameFor(lastPwd);
      fillForm(msg.username, msg.password);
      reply({ filled: true });
      return true;
    }
    if (msg.type === 'SHOW_SAVE_PROMPT') {
      showSaveBar(msg.url, msg.title, msg.username, msg.password);
      reply({ shown: true });
      return true;
    }
    return false;
  });

  // ── Scan & watch ─────────────────────────────────────────────────────────────
  function scan() {
    document.querySelectorAll('input[type="password"]:not([data-kw-done])').forEach(inject);
    watchForms();
  }

  scan();

  // Check for pending save from a previous page
  chrome.runtime.sendMessage({ type: 'GET_PENDING_SAVE' }, (res) => {
    if (!res?.password) return;
    try {
      if (new URL(res.url).hostname === window.location.hostname) {
        setTimeout(() => showSaveBar(res.url, res.title, res.username, res.password), 600);
      }
    } catch {}
  });

  // Watch for dynamically added forms/inputs
  const obs = new MutationObserver(scan);
  obs.observe(document.body || document.documentElement, { childList: true, subtree: true });
})();
