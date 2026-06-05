---
name: API Server CJS Interop
description: How to import CJS-only packages in the ESM api-server, and zod/version gotchas.
---

## Rule
All CJS-only packages in `artifacts/api-server` must use the `createRequire` pattern:

```ts
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs") as typeof import("bcryptjs");
const jwt = require("jsonwebtoken") as typeof import("jsonwebtoken");
const QRCode = require("qrcode") as typeof import("qrcode");
const { authenticator } = require("otplib") as typeof import("otplib");
```

**Why:** The api-server bundles as ESM (`"type": "module"`) via esbuild. Packages like bcryptjs, jsonwebtoken, qrcode, and otplib ship CJS-only dist files — esbuild cannot resolve named ESM exports from them, so a direct `import { authenticator } from "otplib"` will error at build time.

**How to apply:** Any time you add a new npm package to api-server routes, check if it ships an ESM dist. If not, use createRequire.

## Zod version note
- Catalog pins `zod: ^3.25.76` (v3, not v4).
- Use `z.string().email()` not `z.email()` (v4-only).
- `zod` must be declared in `artifacts/api-server/package.json` `dependencies` — it is NOT hoisted from root.
- Import as `import { z } from "zod"` (standard ESM, not CJS — zod ships dual format).
