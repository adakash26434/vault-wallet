# Personal Key Wallet

A secure digital vault for Nepali users — manage passwords, documents, and finances with mandatory Google Authenticator 2FA and AES-256-GCM encryption.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `SESSION_SECRET`, `ENCRYPTION_KEY` (64 hex chars = 256-bit AES key)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Helmet + express-rate-limit
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Frontend: React + Vite + shadcn/ui + Tailwind CSS

## Where things live

- `artifacts/api-server/src/routes/` — Express route handlers (auth, passwords, documents, finance, dashboard)
- `artifacts/api-server/src/lib/crypto.ts` — AES-256-GCM field-level encryption
- `artifacts/api-server/src/middlewares/auth.ts` — requireAuth JWT middleware
- `artifacts/api-server/src/app.ts` — Express app setup (Helmet, CORS, rate limiting)
- `artifacts/personal-key-wallet/src/pages/` — React page components
- `artifacts/personal-key-wallet/src/index.css` — light professional theme (Plus Jakarta Sans, #0078D4)
- `lib/api-spec/openapi.yaml` — source-of-truth API contract
- `lib/api-client-react/src/generated/` — generated React Query hooks + Zod schemas

## Architecture decisions

- **Mandatory TOTP 2FA** — signup flow forces Google Authenticator setup before any session is issued; no bypass possible.
- **AES-256-GCM field-level encryption** — sensitive fields (passwords, usernames, document numbers, TOTP secrets) encrypted at rest using ENCRYPTION_KEY env var; plaintext never stored.
- **JWT auth enforced at router level** — `requireAuth` middleware applied once in `routes/index.ts` after public auth routes; no per-route auth needed.
- **Contract-first API** — OpenAPI spec → Orval codegen → typed React Query hooks; frontend never writes raw fetch calls.
- **CJS interop via createRequire** — bcryptjs, jsonwebtoken, qrcode, otplib all loaded with `createRequire` pattern due to ESM/CJS mixing; otplib cast as `any` (typed cast breaks method signatures).

## Product

- **Password Vault** — store, search, and copy credentials with strength analysis, favicon lookup, and auto-category detection for Nepali services (eSewa, Khalti, NIC Asia, etc.)
- **Secure Documents** — store citizenship, passport, driving licence, insurance cards with expiry tracking and document preview.
- **Finance Tracker** — log income and expenses in NPR with monthly navigation, savings rate calculation, and category breakdown.
- **Security Insights** — vault health score (0–100), active security alerts for weak passwords and expiring documents.
- **TOTP 2FA** — mandatory Google Authenticator integration on every login.

## User preferences

- World-class quality — no shortcuts, no placeholder UIs, no browser `confirm()` dialogs.
- Nepali-specific: currency displayed as "Rs." prefix; banks/wallets (eSewa, Khalti, NIC, Nabil etc.) supported in category auto-detection.
- Light professional theme: Plus Jakarta Sans, primary #0078D4, white cards on #F3F5F7 background.

## Gotchas

- `encryptField()` returns `string | null` — always use `?? ""` for required DB columns and `?? undefined` for optional ones.
- Finance API params: `useListFinanceRecords` expects `month` as `string`, but `useGetFinanceSummary` expects `month` as `number`. Use `String(selectedMonth)` for list.
- otplib must be cast as `any` — typed cast as `TOTP` breaks `.options` and `.verify()` method signatures at runtime.
- Never run `pnpm dev` at workspace root — individual artifacts use workflow-provided PORT env var.
- Run `pnpm --filter @workspace/api-spec run codegen` after any OpenAPI spec change before touching frontend.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
