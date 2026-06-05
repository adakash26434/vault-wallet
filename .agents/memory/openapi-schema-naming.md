---
name: OpenAPI Schema Naming — Auth Prefix Rule
description: Auth-related OpenAPI component schemas must be prefixed with "Auth" to avoid Orval duplicate-export errors.
---

## Rule
All auth-related OpenAPI `components/schemas` entries must use an `Auth*` prefix:
- `AuthLoginBody`, `AuthLoginResponse`
- `AuthSignupBody`, `AuthSignupResponse`
- `AuthVerifyBody`, `AuthVerifySetupBody`
- `AuthSessionResponse`, `AuthUser`

**Why:** Orval generates both request-body types AND response types in the same barrel file (`lib/api-zod/src/generated/api.ts`). Generic names like `LoginBody` or `SignupBody` collide with other generated symbols, causing TypeScript error TS2308 ("already exported a member named X") that breaks the codegen `typecheck:libs` step.

**How to apply:** Whenever adding auth endpoints to the OpenAPI spec, prefix every new schema name with the feature domain (e.g. `Auth*`). The same pattern applies to any future feature that risks name collision — use a namespace prefix.
