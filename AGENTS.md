# Veranda PMS Agent Guide

This is the canonical repository guidance for AI coding agents working in `d:\repos\Defect_Hunt`. [CLAUDE.md](CLAUDE.md) and [GEMINI.md](GEMINI.md) point here; do not create competing copies of these rules.

## Current Repository State

- **Milestone M0 (Documentation & AI Agent Ecosystem)**: Complete. Comprehensive specifications under `docs/`, canonical agent guidance in `AGENTS.md`, and modular rules/skills under `.agents/` are established.
- **Milestone M1–M7 (Application Implementation & Verification)**: Complete and verified (16 November 2026). Full Next.js 16 + Tailwind CSS v4 + shadcn/ui + Supabase Hybrid Sandbox application implemented, `docs/Veranda_PMS_Defect_List.docx` generated, and all 60 planted defects (`VH-01`..`VH-60`) verified via Vitest and Playwright E2E tests under `Asia/Manila` (`UTC+8`).

**Project Identity**: **Veranda PMS** is a Hospitality, Room Allotment, and Guest Folio Management System for the fictional resort company **Solstice Bay Resort & Villas**, created for the **PUPQC BSIT Foundation Month "Defect Hunt"** competition. It pairs a production-grade hospitality workspace with **60 intentionally planted, deterministic software defects (`VH-01` to `VH-60`)** across Easy (5), Medium (31), and Hard (24) tiers.

---

## Mandatory Onboarding

1. Read [README.md](README.md), [docs/README.md](docs/README.md), [docs/PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md), and [docs/FRS_NFRS.md](docs/FRS_NFRS.md).
2. **Read every rule below in numeric order.** These files are explicit instructions referenced by this guide:
   - [00 — Project Context](.agents/rules/00-project-context.md)
   - [10 — Architecture and Stack](.agents/rules/10-architecture-and-stack.md)
   - [20 — Domain and Folio Math](.agents/rules/20-domain-and-folio-math.md)
   - [30 — Defect Injection Governance](.agents/rules/30-defect-injection-governance.md)
   - [40 — Frontend Design System](.agents/rules/40-frontend-design-system.md)
   - [50 — Testing and Verification](.agents/rules/50-testing-and-verification.md)
   - [60 — Documentation and Workflow](.agents/rules/60-documentation-and-workflow.md)
   - [70 — Commit Conventions](.agents/rules/70-commit-conventions.md)
3. Read the narrower documents for the active task using the Documentation Authority map below, then inspect the relevant files.
4. Check Git status when the workspace is a Git repository. Preserve existing user files and reference artifacts (`docs/example/ShopSphere_Defect_List.docx`).

---

## Documentation Authority

Within this repository, requirements and domain specifications define the **Canonical Baseline** ("Expected Behavior"), while [docs/DEFECT_CATALOG.md](docs/DEFECT_CATALOG.md) defines the **60 Authorized Planted Defects** ("Actual Defect Behavior"). Every behavior not explicitly overridden by a `VH-XX` entry in `DEFECT_CATALOG.md` MUST strictly obey the Canonical Baseline.

| Work Area | Owning References |
|---|---|
| Scope, personas, hospitality domain, canonical formulas | [PROJECT_OVERVIEW.md](docs/PROJECT_OVERVIEW.md), [FRS_NFRS.md](docs/FRS_NFRS.md) |
| System topology, hybrid Supabase sandbox, defect engine | [ARCHITECTURE.md](docs/ARCHITECTURE.md), [TECH_STACK.md](docs/TECH_STACK.md) |
| PostgreSQL schema, seed dataset, client storage mirror | [DATABASE.md](docs/DATABASE.md) |
| User journeys, reservation state machine, folio math | [WORKFLOWS.md](docs/WORKFLOWS.md), [ROUTES_AND_FORMS.md](docs/ROUTES_AND_FORMS.md) |
| Visual identity, tokens, shadcn/ui + custom components | [DESIGN.md](docs/DESIGN.md) |
| Auth, RBAC, session handling, security defect boundaries | [SECURITY_AND_AUDIT.md](docs/SECURITY_AND_AUDIT.md) |
| All 60 planted defects (`VH-01`..`VH-60`) | [DEFECT_CATALOG.md](docs/DEFECT_CATALOG.md) |
| Vitest + Playwright verification & traceability | [TESTING.md](docs/TESTING.md), [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) |
| Vercel + Supabase setup & event operations | [DEPLOYMENT_AND_OPS.md](docs/DEPLOYMENT_AND_OPS.md) |
| Reference provenance & adaptation decisions | [REFERENCES.md](docs/REFERENCES.md) |

---

## Non-Negotiable Project Boundaries

1. **Distinct Industry & Brand**: Keep **Veranda PMS** (`Solstice Bay Resort & Villas`) completely distinct from the co-developer's *ShopSphere (`Lumina Goods`)* retail system and from the reference *Clinic EHR* / *Capstone_BGH* medical systems. Never reuse ShopSphere's purple-glow theme, product names, or retail copy.
2. **Exact 60-Defect Contract**: Maintain exactly 60 planted defects (`VH-01` through `VH-60`: 5 Easy, 31 Medium, 24 Hard) as specified in [docs/DEFECT_CATALOG.md](docs/DEFECT_CATALOG.md).
   - **Never accidentally "fix" a planted defect** unless the user explicitly instructs you to toggle or modify that `VH-XX` ID.
   - **Never introduce an undocumented 61st bug.** All non-defect code paths must be rock-solid, validated, and canonical.
   - Annotate every planted defect in source code with `// @defect VH-XX: <short description>`.
3. **Per-Browser Sandbox Isolation**: Every browser client operates inside an isolated `sandbox_id` tenant in Supabase PostgreSQL (with synchronized browser storage mirror keys `veranda.v1.session` and `veranda.v1.db`). Clicking **Reset demo data** must reset only that browser's sandbox in Supabase and local storage, never wiping other contestants' active sessions.
4. **Tech Stack Compliance**: Use Next.js (App Router, TypeScript), Tailwind CSS v4, shadcn/ui primitives extended with custom hospitality components, and Supabase. Deployable on Vercel without Docker runtime dependencies in production.
5. **Plain-Text Formatting Rules**: Never use LaTeX math syntax (`$...$`, `$$...$$`, `\ge`, `\le`, `\rightarrow`, `\times`) in any documentation, code comments, UI copy, or chat output. Always use standard plain ASCII (`>=`, `<=`, `->`, `<-`, `*`, `~=`, `+/-`).

---

## Available Agent Skills (`.agents/skills/`)

Invoke or follow the instructions in these repository skills when performing specialized tasks:

| Skill | Path | Trigger / Purpose |
|---|---|---|
| `workspace-onboarding` | [.agents/skills/workspace-onboarding/SKILL.md](.agents/skills/workspace-onboarding/SKILL.md) | Session opener ("work on Veranda", "start milestone MX"): loads required docs and emits pre-flight readiness block. |
| `defect-injector` | [.agents/skills/defect-injector/SKILL.md](.agents/skills/defect-injector/SKILL.md) | Implementing, auditing, or verifying any of the 60 planted defects (`VH-01`..`VH-60`) against `docs/DEFECT_CATALOG.md`. |
| `defect-verification-e2e` | [.agents/skills/defect-verification-e2e/SKILL.md](.agents/skills/defect-verification-e2e/SKILL.md) | Writing and running Playwright E2E / Vitest tests that assert both planted defect reproduction and canonical behavior. |
| `shadcn-hospitality-ui` | [.agents/skills/shadcn-hospitality-ui/SKILL.md](.agents/skills/shadcn-hospitality-ui/SKILL.md) | Building shadcn/ui overrides and custom hospitality components under the **Cypress & Travertine** design system. |
| `supabase-sandbox-ops` | [.agents/skills/supabase-sandbox-ops/SKILL.md](.agents/skills/supabase-sandbox-ops/SKILL.md) | Writing Supabase migrations, seed data, RLS/RPC reset logic, and browser storage sync. |
| `validator-handout-generator` | [.agents/skills/validator-handout-generator/SKILL.md](.agents/skills/validator-handout-generator/SKILL.md) | Generating the confidential organizer/validator `.docx` and `.md` defect list handout from `docs/DEFECT_CATALOG.md`. |

---

## Working and Verification

- Keep documentation, schema definitions, defect catalog entries, and test assertions synchronized in the same change.
- Do not modify `D:\repos\Capstone_BGH` or `D:\repos\EHR_System`; treat both reference workspaces as strictly read-only.
- Do not delete or overwrite `docs/example/ShopSphere_Defect_List.docx`.
- For documentation-only changes, verify internal relative links, table formatting, Mermaid diagram syntax, requirement ID uniqueness, and complete `VH-01`..`VH-60` coverage.
- Once code scaffolding begins (`M1+`), run `pnpm typecheck`, `pnpm lint`, `pnpm test`, and `pnpm build` to verify changes.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
