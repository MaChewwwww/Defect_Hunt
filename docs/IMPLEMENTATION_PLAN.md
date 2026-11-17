# Implementation Plan

**Status:** Milestones M0–M7 complete and verified (16 November 2026).

---

## 1. Milestone Roadmap

| Milestone | Depends On | Key Deliverables | Completion Evidence |
|---|---|---|---|
| **M0 — Documentation & AI Agent Ecosystem** *(Complete)* | User prompt & reference analysis | Complete `docs/` specification suite (`README`, `PROJECT_OVERVIEW`, `FRS_NFRS`, `ARCHITECTURE`, `TECH_STACK`, `DATABASE`, `DESIGN`, `WORKFLOWS`, `ROUTES_AND_FORMS`, `SECURITY_AND_AUDIT`, `DEFECT_CATALOG`, `TESTING`, `DEPLOYMENT_AND_OPS`, `IMPLEMENTATION_PLAN`, `REFERENCES`), root `README.md`, `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, 8 `.agents/rules/*.md` files, and 6 `.agents/skills/*/SKILL.md` files. | All 25+ Markdown files written; internal links valid; all 60 planted defects (`VH-01`..`VH-60`) specified and mapped to `T-VH-01`..`T-VH-60`. |
| **M1 — Next.js 16, Tailwind v4 & Cypress/Travertine Shell** *(Complete)* | M0 | Initialize Next.js 16 (App Router, TypeScript, `pnpm`), Tailwind CSS v4, `@fontsource` fonts (`Plus Jakarta Sans`, `Instrument Serif`, `JetBrains Mono`), `shadcn/ui` base components, theme tokens (`globals.css`), and responsive workspace layout (sidebar rail, icon rail, `<640px` mobile drawer with `VH-58`, topbar with theme toggle `VH-53` and bell badge `VH-55`, accessibility hooks `VH-59`, and routing 404 vs skeleton `VH-56`). | `pnpm build`, `pnpm lint`, and `pnpm typecheck` pass; workspace shell renders in Dark/Light modes. |
| **M2 — Supabase Schema, Seed Generator & Hybrid Sandbox Store** *(Complete)* | M1 | `supabase/migrations/0001_veranda_pms_schema.sql`, `reset_veranda_sandbox` RPC, relative-date deterministic seed generator (`SB-1001`..`SB-1020`, `RSV-2026`..`RSV-2045`, 10 guests, 3 users), `/api/sandbox/*` Route Handlers, and Hybrid Client Store syncing `veranda.v1.db` and `veranda.v1.session` (`VH-14`). | `"Reset demo data"` populates both Supabase and `localStorage` (`veranda.v1.db`); Vitest unit tests verify seed counts and totals. |
| **M3 — Auth, Registration, Password Reset, Users & Settings** *(Complete)* | M2 | `SplitEditorialAuthShell`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/users`, and `/settings`. Implemented and annotated `VH-01`..`VH-13`, `VH-52`..`VH-55`. | Playwright E2E tests `T-VH-01`..`T-VH-14` and `T-VH-52`..`T-VH-55` pass. |
| **M4 — Rooms & Packages Catalog and Guests Directory** *(Complete)* | M2 | `/rooms`, `/rooms/[id]`, Add/Edit Room modal, Adjust Allotment modal, `/guests`, `/guests/[id]`, Add/Edit Guest modal. Implemented and annotated `VH-21`, `VH-22`, `VH-23`, `VH-25`, `VH-26`, `VH-27`, `VH-28`, `VH-30`, `VH-45`, `VH-46`, `VH-47`, `VH-60`. | Playwright E2E tests for all Room and Guest defects pass. |
| **M5 — Reservations, Printable Guest Folio, Dashboard & Reports** *(Complete)* | M3, M4 | `/reservations`, `/reservations/new`, `/reservations/[id]`, `/reservations/[id]/folio`, `/dashboard`, and `/reports` with CSV export. Implemented and annotated `VH-15`..`VH-20`, `VH-24`, `VH-29`, `VH-31`..`VH-44`, `VH-48`..`VH-51`, `VH-57`. | All folio calculations, status transitions, print folio views, dashboard charts, and CSV exports verified. |
| **M6 — Full 60-Defect Verification Suite (`Vitest` + `Playwright`)** *(Complete)* | M5 | Complete automated test suite (`T-VH-01` through `T-VH-60`) verifying every planted defect under `Asia/Manila` (`UTC+8`). | 5/5 Vitest unit tests and 41/41 Playwright E2E test blocks pass against production build. |
| **M7 — Validator Handout `.docx` Export & Production Readiness** *(Complete)* | M6 | Generated `docs/Veranda_PMS_Defect_List.docx` (matching `docs/example/ShopSphere_Defect_List.docx` structure) and finalized Vercel + Supabase deployment config. | `.docx` handout verified; `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm build`, and `pnpm test:e2e` all pass. |

---

## 2. Definition of Done

1. Every planted defect (`VH-01` to `VH-60`) is implemented with an explicit `// @defect VH-XX` code annotation, matches [DEFECT_CATALOG.md](DEFECT_CATALOG.md) word-for-word, and passes its automated `T-VH-XX` verification test.
2. Every non-defect feature adheres strictly to the canonical baseline in [FRS_NFRS.md](FRS_NFRS.md) and [WORKFLOWS.md](WORKFLOWS.md).
3. Clicking **Reset demo data** restores the browser's isolated sandbox (`sandbox_id` in Supabase + `veranda.v1.db` in `localStorage`) cleanly and deterministically.
4. All documentation, rules, and skills remain synchronized with the implemented codebase.
