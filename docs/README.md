# Documentation Index

**Baseline Date:** 16 November 2026  
**Status:** Milestones M0–M7 complete and verified. See [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) and [TESTING.md](TESTING.md).

---

## Reading Order

1. [Project Overview](PROJECT_OVERVIEW.md): Why **Veranda PMS** (`Solstice Bay Resort & Villas`) exists, its PUPQC BSIT *Defect Hunt* competition context, user personas, canonical domain formulas, and scope boundaries.
2. [Functional & Non-Functional Requirements](FRS_NFRS.md): Role capability matrix, numbered `FR-*` and `NFR-*` obligations, and canonical business invariants.
3. [User Workflows](WORKFLOWS.md): How resort staff and administrators perform reservations, room allotment management, guest check-in/out, folio printing, and reporting.
4. [Architecture](ARCHITECTURE.md) and [Technology Stack](TECH_STACK.md): Next.js 16 + Supabase PostgreSQL hybrid sandbox architecture, dual-contract Defect Injection Engine, and selected libraries.
5. [Database Specification](DATABASE.md) and [Routes & Form Contracts](ROUTES_AND_FORMS.md): PostgreSQL tables, RPC functions, client storage mirrors, seed dataset, App Router pages, and API route contracts.
6. [Design System](DESIGN.md) and [Security & Audit](SECURITY_AND_AUDIT.md): **Cypress & Travertine** hospitality design tokens, custom components, authentication/RBAC, and security defect boundaries.
7. [Planted Defect Catalog](DEFECT_CATALOG.md): Confidential master specification of all **60 planted defects (`VH-01` to `VH-60`)** across Easy (5), Medium (31), and Hard (24) tiers.
8. [Testing & Verification](TESTING.md), [Deployment & Operations](DEPLOYMENT_AND_OPS.md), and [Implementation Plan](IMPLEMENTATION_PLAN.md): Dual-mode automated verification, Vercel + Supabase deployment runbook, and milestone roadmap.
9. [References & Adaptation Record](REFERENCES.md): Provenance from `EHR_System`, `Capstone_BGH`, `ShopSphere_Defect_List.docx`, and official library documentation.

---

## Document Ownership Matrix

| Question | Authoritative Document |
|---|---|
| What is the company, industry, and competition purpose? | [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md) |
| Is a feature in scope? Which role can use it in the canonical baseline? | [FRS_NFRS.md](FRS_NFRS.md) |
| Which layer or module owns a runtime behavior or sandbox sync? | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Which packages, versions, fonts, and UI primitives are approved? | [TECH_STACK.md](TECH_STACK.md) |
| Which PostgreSQL tables, columns, seed records, and localStorage mirrors exist? | [DATABASE.md](DATABASE.md) |
| How does an operational workflow progress from start to completion? | [WORKFLOWS.md](WORKFLOWS.md) |
| Which Next.js route, API endpoint, form schema, and HTTP status code apply? | [ROUTES_AND_FORMS.md](ROUTES_AND_FORMS.md) |
| How should the interface, custom components, and printable folio look and behave? | [DESIGN.md](DESIGN.md) |
| What are the canonical authentication, session, and RBAC rules vs. planted security bugs? | [SECURITY_AND_AUDIT.md](SECURITY_AND_AUDIT.md) |
| What are the exact 60 planted defects, their steps to reproduce, and their expected vs. actual behavior? | [DEFECT_CATALOG.md](DEFECT_CATALOG.md) |
| How do we automatically verify both the canonical baseline and the 60 planted defects? | [TESTING.md](TESTING.md) |
| How is the system deployed to Vercel and Supabase and operated during the PUPQC event? | [DEPLOYMENT_AND_OPS.md](DEPLOYMENT_AND_OPS.md) |
| What are the implementation milestones and definition of done? | [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) |
| What patterns were adapted from `EHR_System`, `Capstone_BGH`, and `ShopSphere`? | [REFERENCES.md](REFERENCES.md) |

---

## Maintenance Rules

- Keep every definition authoritative in its owning document and link to it using relative Markdown links.
- Maintain strict separation between the **Canonical Specification** (what a defect-free hospitality PMS must do) and the **Planted Defect Catalog** ([DEFECT_CATALOG.md](DEFECT_CATALOG.md), which specifies the 60 intentional deviations `VH-01`..`VH-60`).
- When modifying any requirement, schema column, seed record, or planted defect, update `FRS_NFRS.md`, `DATABASE.md`, `DEFECT_CATALOG.md`, and `TESTING.md` in the same change.
- Follow the plain-ASCII formatting rule across all documents: never use LaTeX math syntax (`$...$`, `\ge`, `\le`, `\rightarrow`); always use plain ASCII (`>=`, `<=`, `->`, `<-`, `*`, `~=`).
