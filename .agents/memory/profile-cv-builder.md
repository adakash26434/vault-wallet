---
name: Profile + CV Builder
description: Architecture for the user profile page and CV builder feature.
---

## DB changes (lib/db/src/schema/users.ts)
Added: phone, dateOfBirth (date), bio, avatarColor, address columns.

## DB new table (lib/db/src/schema/cv.ts)
cv_profiles: one row per user (userId FK). experience/education/skills/languages stored as JSON strings (not JSONB) to avoid Drizzle typing issues.

## API routes (artifacts/api-server/src/routes/auth.ts)
- PATCH /api/auth/profile — updates name/phone/dob/bio/address/avatarColor; reads auth from Authorization header (not requireAuth middleware — placed before it in auth.ts)
- POST /api/auth/change-password — verifies current pw with bcrypt, hashes new; reads auth from header same way
- GET /api/auth/me — updated to return all new fields

## CV route (artifacts/api-server/src/routes/cv.ts)
- GET /api/cv — returns null if no CV yet
- PUT /api/cv — upsert (insert or update) based on userId

## Frontend
- AuthContext.tsx: AuthUser interface extended with phone/dateOfBirth/bio/address/avatarColor
- Profile page: /profile route; avatar color picker (10 swatches); editable personal details; change password inline form
- CVBuilder page: /cv route; left panel = form with collapsible sections; right panel = live preview using inline styles; Print button opens new window and triggers print dialog (→ Save as PDF)

**Why JSON strings for CV sections:** Drizzle `jsonb` requires casting; using `text` with JSON.stringify/parse avoids type errors and works identically in PostgreSQL.

**Print to PDF:** window.open() + doc.write with @media print CSS, then win.print() after 400ms delay. No external lib needed.
