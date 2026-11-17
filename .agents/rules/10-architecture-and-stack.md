# 10 — Architecture and Stack

Follow [ARCHITECTURE.md](../../docs/ARCHITECTURE.md), [TECH_STACK.md](../../docs/TECH_STACK.md), and [DATABASE.md](../../docs/DATABASE.md).

## Framework & Tooling Rules

- Keep one Next.js 16 (App Router, React 19, TypeScript 5) application at the repository root.
- Use `pnpm` (`corepack pnpm`) exclusively as the package manager; commit `pnpm-lock.yaml` when scaffolded. Do not mix `npm` or `yarn` lockfiles.
- Use Tailwind CSS v4 with semantic CSS custom properties (`src/app/globals.css`) and self-hosted `@fontsource` typography (`Plus Jakarta Sans`, `Instrument Serif`, `JetBrains Mono`) plus `lucide-react` icons. Never load external Google Fonts or icon CDNs at runtime.
- Use `shadcn/ui` base primitives (`src/components/ui/`) paired with bespoke hospitality domain components (`src/components/hospitality/`).

## Hybrid Supabase Sandbox Persistence Rules

- Every browser instance operates inside an isolated `sandbox_id` (UUID v4) so 50+ concurrent PUPQC BSIT contestants can mutate, delete, and reset data simultaneously without affecting one another.
- Persist sandbox records in **Supabase PostgreSQL** (`sandboxes`, `users`, `rooms_packages`, `allotment_adjustments`, `guests`, `reservations`, `reservation_items`, `password_reset_tokens`) scoped by `sandbox_id` AND mirror the active sandbox dataset in browser `localStorage` under `veranda.v1.db` and `veranda.v1.session`.
- Why the local mirror is mandatory: Contestants inspecting `DevTools > Application > Local Storage` must be able to observe and reproduce `VH-08` (session stored in `localStorage` when `"Remember me"` is unchecked), `VH-13` (client role privilege escalation by editing `"role":"staff"` to `"role":"admin"` in `veranda.v1.session`), and `VH-14` (plaintext passwords in `veranda.v1.db > users`).
- Clicking **"Reset demo data"** in the login footer must atomically reset both the browser's Supabase `sandbox_id` slice (via `POST /api/sandbox/reset` -> `reset_veranda_sandbox`) and `localStorage` (`veranda.v1.db`, `veranda.v1.session`), anchoring relative reservation dates to today in `Asia/Manila` (`UTC+8`).

## Environment & Deployment Boundaries

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only inside Next.js Route Handlers (`src/app/api/sandbox/*`). Never expose service-role keys in `NEXT_PUBLIC_*` client bundles.
- Ensure the entire application builds and runs cleanly on Vercel Serverless + Supabase Cloud without requiring Docker containers in production.
