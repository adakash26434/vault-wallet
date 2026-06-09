# Key Wallet Browser Extension

RoboForm-better Nepal password manager extension for Chrome & Firefox.

## Features
- **Auto-fill** passwords on any website with one click
- **Save prompt** — shows "Save to Key Wallet?" when you log in
- **Favicon list** — see site icons, usernames, and strength indicators  
- **Search** — find any saved password instantly
- **Sort** — Popular / Recent / A–Z
- **Secure** — communicates only with your Key Wallet vault

## Setup: Generate Icons First

```bash
node browser-extension/generate-icons.mjs
```

This creates `browser-extension/icons/icon16.png`, `icon48.png`, `icon128.png`.

## Install in Chrome (Developer Mode)

1. Open Chrome → go to `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `browser-extension/` folder
5. Pin the Key Wallet icon from the extensions toolbar

## Install in Firefox

1. Open Firefox → go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on…**
3. Navigate to `browser-extension/` and select `manifest.json`

For permanent install: submit to [Firefox Add-ons](https://addons.mozilla.org/developers/)

## Publish to Chrome Web Store

1. Zip the entire `browser-extension/` folder:
   ```bash
   cd browser-extension && zip -r ../key-wallet-extension.zip . -x "*.DS_Store" -x "generate-icons.mjs" -x "README.md"
   ```
2. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
3. Pay one-time $5 developer fee
4. Upload the zip, fill in description + screenshots
5. Submit for review (~1–3 days)

## How It Works

```
Popup → chrome.runtime.sendMessage → Background Service Worker → Key Wallet API
                                   ↑
Content Script (every webpage) ←──┘
```

- **popup.html/js** — Extension popup UI (search, fill, auth)
- **background.js** — Service worker; handles all API calls & auth token storage
- **content.js** — Injected on every page; detects forms, shows fill button & save bar

## API
Points to: `https://digital-life-vault--eprabhupokhara.replit.app`

To change the API URL, update `API_BASE` at the top of both `background.js` and `popup.js`.
