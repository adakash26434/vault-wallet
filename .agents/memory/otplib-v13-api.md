---
name: otplib v13 API
description: otplib v13 has no authenticator sub-object — uses top-level functions instead of v12 authenticator pattern
---

## Rule
otplib v13.x (installed) has NO `authenticator` object. Use top-level functions:
- `generateSecret()` — generate TOTP secret
- `generateURI({ type, label, secret, issuer })` — replaces `authenticator.keyuri()`
- `verify({ token, secret })` — replaces `authenticator.verify()`
- `generate(secret)` — generate current token

## What does NOT exist in v13
- `_otplib.authenticator` — undefined (was v12)
- `authenticator.keyuri()` — use `generateURI` instead
- `authenticator.options = { window }` — no longer needed for basic verify

## How to apply in auth.ts (createRequire pattern)
```ts
const _otplib = require("otplib") as any;
const otpGenerateSecret: () => string = _otplib.generateSecret;
const otpGenerateURI: (opts: Record<string, unknown>) => string = _otplib.generateURI;
const otpVerify: (opts: { token: string; secret: string }) => boolean = _otplib.verify;
```

**Why:** otplib v13 completely redesigned the API to be plugin-based with top-level functions. The old `authenticator` sub-object pattern from v12 no longer exists. The fallback `_otplib.authenticator ?? _otplib.default?.authenticator ?? _otplib` resolves to the whole module object which does NOT have `keyuri` on it.
