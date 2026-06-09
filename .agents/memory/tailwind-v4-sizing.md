---
name: Tailwind v4 sizing classes
description: h-4.5/w-4.5 don't exist in Tailwind v4's CSS-first config — use arbitrary values instead.
---

# Tailwind v4 half-step sizes

The project uses Tailwind v4 with CSS-based configuration (`@import "tailwindcss"` in index.css, no `tailwind.config.ts`).

**Rule:** Classes like `h-4.5`, `w-4.5` do NOT exist in Tailwind v4. The spacing scale jumps from `h-4` (1rem/16px) to `h-5` (1.25rem/20px).

**Why:** Tailwind v4 dropped the intermediate half-step utilities. They were never part of the standard scale and silently produce no CSS when used.

**How to apply:** For 18px icons (the common use case), use `h-[18px] w-[18px]`. For other in-between sizes, always use arbitrary values: `h-[Xpx] w-[Xpx]`.
