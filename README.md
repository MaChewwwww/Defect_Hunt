# Veranda PMS — Solstice Bay Resort & Villas (Defect Hunt Edition)

**Veranda PMS** is a full-stack Hospitality, Room Allotment, and Guest Folio Management System built for the fictional luxury coastal resort operator **Solstice Bay Resort & Villas**.

This repository is engineered specifically for the **Polytechnic University of the Philippines — Quezon City (PUPQC) BSIT Foundation Month** competition event: **Defect Hunt**. It serves as the official second competition system alongside the retail-focused *ShopSphere (Lumina Goods)* platform, providing an independent industry domain, visual identity, and seed dataset while maintaining an identical 60-defect competition difficulty profile (`5 Easy`, `31 Medium`, `24 Hard`).

---

## System Summary

| Attribute | Specification |
|---|---|
| **Platform Name** | **Veranda PMS** (Property, Room & Folio Management System) |
| **Fictional Organization** | **Solstice Bay Resort & Villas** (San Juan, La Union & El Nido, Palawan) |
| **Event Context** | PUPQC BSIT Foundation Month — **Defect Hunt** Competition |
| **Frontend & Framework** | Next.js 16 (App Router, React 19, TypeScript 5), Tailwind CSS v4, shadcn/ui + bespoke hospitality components |
| **Backend & Persistence** | Supabase (PostgreSQL 17, RPC sandbox reset functions) + Hybrid Browser Sandbox Mirror (`localStorage`) |
| **Deployment Target** | Vercel (Edge/Node serverless runtime) + Supabase Cloud |
| **Design System** | **Cypress & Travertine** — coastal architectural hospitality workspace (Dark theme default with Light mode switch) |
| **Planted Defects** | **60 deterministic defects** (`VH-01` to `VH-60`: 5 Easy, 31 Medium, 24 Hard) |
| **Timezone & Currency** | `Asia/Manila` (`UTC+8`), Philippine Peso (`PHP`), dates formatted `MM/DD/YYYY` |

---

## Demo Accounts

Displayed on the login screen for contestant and validator convenience:

| Role | Email | Password | Display Name & Notes |
|---|---|---|---|
| **Admin** | `admin@verandapms.test` | `Admin@123` | **Elena Marasigan** — General Manager (full administrative access) |
| **Staff** | `staff@verandapms.test` | `Staff@123` | **Marco Villanueva** — Front Desk Concierge (operational access) |
| **Staff (deactivated)** | `former@verandapms.test` | `Former@123` | **Tricia Soriano** — Former Concierge (`is_active = false`) |
| **Group 1 — Coral Villa** | `group1@verandapms.test` | `Group1@123` | Isolated data ownership (`00000000-0000-4000-8000-000000000001`) |
| **Group 2 — Cypress Cove** | `group2@verandapms.test` | `Group2@123` | Isolated data ownership (`00000000-0000-4000-8000-000000000002`) |
| **Group 3 — Lagoon Sanctuary** | `group3@verandapms.test` | `Group3@123` | Isolated data ownership (`00000000-0000-4000-8000-000000000003`) |
| **Group 4 — Terracotta Cliff** | `group4@verandapms.test` | `Group4@123` | Isolated data ownership (`00000000-0000-4000-8000-000000000004`) |
| **Group 5 — Solstice Horizon** | `group5@verandapms.test` | `Group5@123` | Isolated data ownership (`00000000-0000-4000-8000-000000000005`) |

---

## Canonical Comparison Rules (For Validators & Contestants)

When hunting and validating defects, the following canonical business rules represent the **Expected** system behavior:

1. **Folio Total Formula**:
   - `Subtotal = sum(unit_rate * quantity)` across all reservation line items
   - `Discount Amount = Subtotal * (discount_percent / 100)`
   - `Net Subtotal = Subtotal - Discount Amount`
   - `Tax (12% VAT) = 0.12 * Net Subtotal`
   - `Service & Environmental Fee = 250.00` (fixed flat fee per reservation)
   - `Grand Total = (Subtotal - Discount Amount) + 12% VAT on (Subtotal - Discount Amount) + 250.00 Service & Environmental Fee`
2. **Allotment (Inventory) Lifecycle**:
   - Room/package `available_units` are deducted **once** when a reservation is created (`Pending` or `Confirmed`) and restored when a reservation is transitioned to `Cancelled`.
   - **Low Allotment** means `available_units <= 5`.
3. **Revenue & KPI Aggregation**:
   - Revenue metrics exclude `Cancelled` reservations and include the `250.00` Service & Environmental Fee.
   - Average Booking Value (`ABV`) = `Non-Cancelled Revenue / Non-Cancelled Reservation Count`.
4. **Dates & Timezones**:
   - All user-facing dates are formatted `MM/DD/YYYY` in the browser's local timezone (`Asia/Manila`, `UTC+8` during the competition).
5. **Per-Browser Sandbox Isolation**:
   - Each browser session receives an isolated `sandbox_id` backed by Supabase and mirrored in browser storage. Clicking **Reset demo data** in the login page footer (or topbar utility) restores the original seed dataset for that browser without affecting other contestants.

---

## Documentation-Driven Development Index

Read [docs/README.md](docs/README.md) for the complete specification suite:

1. [Project Overview](docs/PROJECT_OVERVIEW.md) — Domain scope, personas, modules, and canonical rules.
2. [Functional & Non-Functional Requirements](docs/FRS_NFRS.md) — Role matrix, `FR-*` and `NFR-*` obligations.
3. [Architecture](docs/ARCHITECTURE.md) — Next.js + Supabase hybrid sandbox architecture and defect injection engine.
4. [Technology Stack](docs/TECH_STACK.md) — Pinned libraries, shadcn/ui base primitives, and custom components.
5. [Database Specification](docs/DATABASE.md) — Supabase PostgreSQL schema, seed records, and client mirror structure.
6. [Design System](docs/DESIGN.md) — **Cypress & Travertine** tokens, typography, layouts, and component specs.
7. [User Workflows](docs/WORKFLOWS.md) — End-to-end operational flows and state transitions.
8. [Routes & Form Contracts](docs/ROUTES_AND_FORMS.md) — App Router routes, API handlers, and validation contracts.
9. [Security & Audit](docs/SECURITY_AND_AUDIT.md) — Canonical security baseline vs. intentional security defect exceptions.
10. [Planted Defect Catalog](docs/DEFECT_CATALOG.md) — Confidential master list of all 60 planted defects (`VH-01` to `VH-60`).
11. [Testing & Verification](docs/TESTING.md) — Vitest + Playwright dual-contract verification strategy.
12. [Deployment & Operations](docs/DEPLOYMENT_AND_OPS.md) — Vercel + Supabase deployment and PUPQC event runbook.
13. [Implementation Plan](docs/IMPLEMENTATION_PLAN.md) — Phased delivery milestones (`M0` to `M7`).
14. [References & Adaptation Record](docs/REFERENCES.md) — Provenance from reference repositories and *ShopSphere* baseline.

---

## AI Agent Guidance

Coding agents MUST read [AGENTS.md](AGENTS.md) first, followed by all rule files in `.agents/rules/` and task skills in `.agents/skills/`.
