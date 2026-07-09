---
name: OpenAPI Codegen Name Conflicts
description: How to avoid duplicate export conflicts when Orval generates both Zod schemas and TypeScript interfaces with the same name.
---

## The problem
Orval generates two outputs:
1. `lib/api-zod/src/generated/api.ts` — Zod schema constants, named after operation (e.g. `ChangePasswordBody`)
2. `lib/api-zod/src/generated/types/changePasswordBody.ts` — TS interface with the same name

Both are re-exported from `lib/api-zod/src/index.ts`. TypeScript raises TS2308 "already exported a member" when both exports share a name.

## Why it's inconsistent
Orval uses the **OpenAPI schema name** for the types/ output and the **operation request body** name for api.ts. When these happen to match (e.g. schema name = `ChangePasswordBody`), there's a collision. When they differ (e.g. schema `AuthSignupBody` vs operation generates `SignupBody`), no collision.

## The fix
Rename the OpenAPI schema to something that won't match the Orval-generated operation name. Example: rename `ChangePasswordBody` → `ChangePasswordRequest` in openapi.yaml. Then re-run codegen.

**How to apply:** Whenever adding a new requestBody schema to openapi.yaml, check if its name matches the pattern `{OperationId}Body` (e.g. operationId=`changePassword` + schema=`ChangePasswordBody` → collision). Use a different suffix: `Request`, `Payload`, or add a prefix.
