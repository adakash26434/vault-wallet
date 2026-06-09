---
name: Browser Extension + PWA
description: Architecture and gotchas for the Key Wallet Chrome/Firefox extension and PWA setup.
---

## Browser Extension (browser-extension/)

- Manifest V3 — service worker is `background.js`, content script is `content.js`
- Auth flow: POST /api/auth/login → {requires2FA, tempToken} → POST /api/auth/verify → {token: JWT}
- JWT stored as `kw_token` in `chrome.storage.local`; `kw_user` for user object
- All API calls go through background.js service worker (bypasses CORS entirely — no CORS config change needed in app.ts)
- API base: production URL (`https://digital-life-vault--eprabhupokhara.replit.app`)
- Content script: injects shield button next to `input[type=password]` fields, autofill dropdown on click, save bar on form submit

**Why:** Extension service workers bypass browser CORS; routing fetches through background.js avoids needing `*` in express CORS config.

**Icons:** Run `node browser-extension/generate-icons.mjs` to generate icon16/48/128.png + pwa-192/512.png before loading in browser

**Packaging:** `zip` not available on NixOS — use `tar -czf` or Node.js archiver for packaging

## PWA (vite-plugin-pwa)

- Installed in `artifacts/personal-key-wallet`
- Config in `vite.config.ts` — VitePWA plugin with workbox strategies
- PWA icons at `public/pwa-192.png` and `public/pwa-512.png`
- Install banner in `Layout.tsx` using `beforeinstallprompt` event + `useRef` (NOT useState) for the prompt event
- `sessionStorage` key `kw-pwa-dismissed` tracks dismissal

**Gotcha:** `BeforeInstallPromptEvent` is not in lib.dom.d.ts — must declare the type inline or as an interface in the component file. Must NOT reference `setPwaPrompt` (not a state — use ref pattern).
