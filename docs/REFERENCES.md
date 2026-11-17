# References and Adaptation Record

**Inspection Date:** 16 November 2026  
**Note:** Reference repositories (`D:\repos\EHR_System` and `D:\repos\Capstone_BGH`) and the co-developer handout (`docs/example/ShopSphere_Defect_List.docx`) were inspected strictly read-only. No files in those reference workspaces were modified.

---

## 1. Local Reference Provenance

| Source Location | What Was Adapted into `d:\repos\Defect_Hunt` | What Was Excluded or Replaced |
|---|---|---|
| `docs/example/ShopSphere_Defect_List.docx` | Competition structure for PUPQC BSIT *Defect Hunt*: 60 total planted defects (`5 Easy`, `31 Medium`, `24 Hard`), 3 test account archetypes (`Admin`, `Staff`, `Deactivated Staff`), per-browser `"Reset demo data"` workflow, `Asia/Manila` (`UTC+8`) timezone defect mechanics, and balanced defect category coverage (Functional, Validation, Security, Data, UI, Usability, Accessibility). | Replaced ShopSphere's retail e-commerce domain (`Lumina Goods`, products, stock, shipping fee `150.00`, sales orders `SO-XXXX`) and dark purple-blue aesthetic with **Veranda PMS (`Solstice Bay Resort & Villas`)**, a boutique hospitality & guest folio platform (`SB-XXXX` rooms/packages, `RSV-20XX` reservations, `250.00` Resort Service & Environmental Fee, guest folios, and **Cypress & Travertine** coastal aesthetic). |
| `D:\repos\EHR_System\AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.agents/rules/00..70` | Canonical `AGENTS.md` entrypoint pattern, concise `CLAUDE.md` and `GEMINI.md` pointer files, numbered `.agents/rules/00..70` reading sequence, and documentation ownership matrix in `docs/README.md`. | Replaced Laravel/Blade/MySQL/RustFS clinical record rules with Next.js 16, Tailwind CSS v4, shadcn/ui, Supabase PostgreSQL sandbox isolation, and Dual-Contract Defect Injection Governance. |
| `D:\repos\EHR_System\docs/*` (`ARCHITECTURE.md`, `DESIGN.md`, `TECH_STACK.md`, `DATABASE.md`, `FRS_NFRS.md`, `WORKFLOWS.md`, `ROUTES_AND_FORMS.md`, `SECURITY_AND_AUDIT.md`, `TESTING.md`, `IMPLEMENTATION_PLAN.md`) | Document-driven development structure, Mermaid architecture/ER/sequence diagrams, tabular requirement-to-test traceability (`FR-*` -> `T-*`), and explicit token/screen tables in `DESIGN.md`. | Adapted from a single-clinic medical chart monolith to a multi-contestant cloud-deployed hospitality PMS with 60 intentional QA competition defects. |
| `D:\repos\Capstone_BGH\AGENTS.md`, `UHSE_Frontend/AGENTS.md`, and `.agents/skills/*/SKILL.md` | Task-oriented `.agents/skills/<skill-name>/SKILL.md` structure with YAML frontmatter, trigger conditions, pre-flight onboarding block (`workspace-onboarding`), Playwright E2E test mapping (`e2e-test-creator`), and Next.js + Tailwind + shadcn/ui customization documentation (`shadcn_customizations.md`). | Excluded multi-container microservices, BGH API Gateway headers (`X-Gateway-Secret`), RabbitMQ, ClickHouse, and hospital clinical modules. |

---

## 2. Official Technical Documentation References

| Technology | Official Reference | Purpose in Veranda PMS |
|---|---|---|
| **Next.js (App Router)** | https://nextjs.org/docs/app | Dynamic route segments, Route Handlers (`/api/sandbox/*`), layouts, and Vercel deployment. |
| **Tailwind CSS v4** | https://tailwindcss.com/docs | CSS custom property theming, dark/light mode variants, and `@media print` folio layout. |
| **shadcn/ui** | https://ui.shadcn.com/docs | Accessible Radix-based UI primitives customized with **Cypress & Travertine** tokens. |
| **Supabase JS & Postgres** | https://supabase.com/docs/reference/javascript | PostgreSQL persistence, RPC execution (`reset_veranda_sandbox`), and tenant filtering. |
| **Playwright** | https://playwright.dev/docs/intro | Browser E2E testing with `timezoneId: 'Asia/Manila'` and viewport emulation. |
| **Vitest** | https://vitest.dev/guide/ | Fast TypeScript unit tests for hospitality folio math and defect evaluators. |
| **AGENTS.md Specification** | https://agents.md/ | Standard repository entrypoint convention for AI coding agents. |
