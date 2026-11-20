# Technology Stack Specification

**Status:** Approved baseline (Milestone M0).  
**Target Environment:** Vercel (Production/Preview) + Supabase Cloud (PostgreSQL 17).

---

## 1. Core Technology Baseline

| Category | Technology | Selected Version Family | Purpose & Rationale |
|---|---|---|---|
| **Framework** | Next.js (App Router) | `16.x` (or `15.x` stable) | Full-stack React framework, dynamic routes, Route Handlers (`/api/sandbox/*`), and instant Vercel deployment. |
| **UI Runtime** | React & React DOM | `19.x` | Component rendering, client state transitions, and server/client composition. |
| **Language** | TypeScript | `5.x` (`strict: true`) | End-to-end static typing across Supabase tables, domain models, folio math, and defect registry. |
| **Package Manager** | `pnpm` | `9.x` / `10.x` | Fast, deterministic dependency resolution with `pnpm-lock.yaml`. |
| **Styling** | Tailwind CSS | `4.x` | Utility-first styling, semantic CSS variables (`--bg-canvas`, `--accent-primary`), dark/light mode tokens, and `@media print` folio layout. |
| **Base UI Primitives** | `shadcn/ui` + Radix UI (`@radix-ui/react-*`) | Latest CLI primitives | Accessible base primitives (`Button`, `Input`, `Select`, `Dialog`, `Sheet`, `Table`, `Tabs`, `Badge`, `DropdownMenu`, `Switch`, `Checkbox`, `Skeleton`, `Card`, `Separator`) customized to the **Cypress & Travertine** design system. |
| **Custom Components** | Veranda Hospitality UI (`src/components/hospitality/*`) | Application-owned | Bespoke hospitality components required beyond base shadcn/ui (`FolioMathBreakdown`, `AllotmentHealthBar`, `ReservationLifecycleStepper`, `RevenueOccupancyChart`, `GuestFolioPrintSheet`, `DemoAccountsCard`, `SandboxFooterBar`). |
| **Database & Cloud Backend** | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | `2.x` | Managed PostgreSQL 17 persistence, tenant-scoped (`sandbox_id`) tables, and atomic `reset_veranda_sandbox` RPC execution. |
| **State & Hybrid Store** | Zustand (`zustand`) or React Context + Sync Adapter | `5.x` | Synchronizes active `sandbox_id` state between Supabase PostgreSQL and browser `localStorage` (`veranda.v1.db`, `veranda.v1.session`). |
| **Forms & Validation** | React Hook Form + Zod (`zod`, `@hookform/resolvers`) | `7.x` / `3.x` | Structured form state and validation schemas (with intentional validation bypasses documented for `VH-21`, `VH-23`, `VH-33`, `VH-34`, `VH-42`, `VH-45`, `VH-48`). |
| **Charts & Visualization** | Recharts (`recharts`) or Custom Interactive SVG Bar Chart | `2.x` / Custom | Renders the Dashboard 6-month **Monthly Revenue & Bookings Chart** with hover tooltips and `VH-18` UTC month-bucketing behavior. |
| **Date & Timezone Utilities** | `date-fns` | `4.x` | Date arithmetic, `MM/DD/YYYY` formatting, and local vs. UTC timezone comparisons (`Asia/Manila`, `UTC+8`). |
| **Toast Notifications** | Sonner (`sonner`) | `2.x` | Stacked non-blocking toast notifications for reservation saves, allotment adjustments, status changes, and sandbox resets. |
| **Icons** | Lucide React (`lucide-react`) | `1.x` | Clean architectural and hospitality icons bundled locally without external CDN calls. |
| **Typography Packages** | `@fontsource-variable/plus-jakarta-sans`, `@fontsource/instrument-serif`, `@fontsource-variable/jetbrains-mono` | `5.x` | Locally bundled self-hosted web fonts for zero-latency rendering and offline/campus Wi-Fi resilience. |
| **Unit & Integration Testing** | Vitest (`vitest`, `@testing-library/react`) | `3.x` | Fast unit verification of folio math, date filters, CSV serialization, and all 60 planted defect evaluators. |
| **End-to-End Browser Testing** | Playwright (`@playwright/test`, `@axe-core/playwright`) | `1.50+` | Automated browser verification across all 60 planted defects (`VH-01`..`VH-60`), responsive viewports (`390px`, `768px`, `1440px`), and timezone emulation (`Asia/Manila`). |

---

## 2. UI Library Decision & Custom Component Strategy

| Layer | Role in Veranda PMS | Customization & Ownership Rules |
|---|---|---|
| **shadcn/ui Base Components (`src/components/ui/`)** | Provides foundational form controls, modals, drawers, tables, badges, and popovers. | Must be restyled with **Cypress & Travertine** tokens (warm stone borders, coastal cypress dark surfaces, burnished terracotta/jade accents, `10px` card radii). Never leave raw default zinc/slate shadcn styles untouched. |
| **Custom Hospitality Components (`src/components/hospitality/`)** | Implements domain-specific resort operations views that do not exist in standard UI kits. | Built specifically for Veranda PMS: interactive multi-line Reservation Builder, live Folio Tax & Service Fee Calculator, Room Allotment Visual Meter, Printable Guest Folio (`@media print`), Guest Loyalty Tier Badge, and Demo Account Quick-Fill Card. |

---

## 3. IntentionalDefect-Specific Technical Decisions

Because **Veranda PMS** is a **Defect Hunt** competition target, several technical choices are deliberately structured to make all 60 defects deterministic and inspectable by BSIT students:

1. **Dual Persistence (`Supabase PostgreSQL` + `localStorage` Mirror)**:
   - Supabase PostgreSQL persists all `sandbox_id`-scoped tables in the cloud so the app is a genuine full-stack Next.js + Supabase application.
   - Simultaneously, the client store mirrors the active sandbox dataset into `localStorage` under `veranda.v1.db` and the active user session under `veranda.v1.session`.
   - This allows students inspecting `DevTools > Application > Local Storage` to discover and reproduce `VH-08` (session stored in `localStorage` even when `"Remember me"` is unchecked), `VH-13` (client role privilege escalation by changing `"role":"staff"` to `"role":"admin"` in `veranda.v1.session`), and `VH-14` (plaintext passwords visible in `veranda.v1.db > users`).
2. **Client-Aware Timezone Evaluation (`Asia/Manila` vs `UTC`)**:
   - The application reads the browser's runtime timezone while storing canonical ISO-8601 UTC timestamps (`TIMESTAMPTZ`).
   - This allows `VH-18` (Dashboard monthly chart groups by UTC month instead of local month) and `VH-44` (Reservation detail page displays UTC time instead of local time) to behave identically to real-world timezone bugs when tested in `Asia/Manila` (`UTC+8`).
3. **Simulated In-App Password Reset Link Preview**:
   - Instead of requiring external SMTP email delivery (which would fail on `.test` domains like `staff.group1@verandapms.test`), submitting the Forgot Password form generates a signed token in `password_reset_tokens` and displays an in-app `"Open reset link"` button/preview card so contestants can immediately test `VH-07` (reusable password reset link within its 30-minute expiry window).

---

## 4. Intentionally Omitted Dependencies

- **No NextAuth / Auth.js or opaque HttpOnly-only Supabase Auth GoTrue sessions** for the contestant login flow: using an opaque GoTrue JWT would prevent contestants from testing `VH-08`, `VH-09`, `VH-13`, and `VH-14` in `DevTools > Application > Local Storage`. Instead, authentication validates against the `users` table in the active Supabase `sandbox_id` (and `veranda.v1.db` mirror) and writes the inspectable `veranda.v1.session` object.
- **No External Font or Icon CDNs**: All fonts and icons are installed via `pnpm` packages.
- **No Server-Side Headless Browser PDF Generator**: Printable guest folios (`/reservations/[id]/folio`) use semantic HTML and `@media print` CSS for instant rendering on Vercel serverless functions.
