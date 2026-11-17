# 60 — Documentation and Workflow

Use [docs/README.md](../../docs/README.md) for document ownership and [IMPLEMENTATION_PLAN.md](../../docs/IMPLEMENTATION_PLAN.md) for milestone status.

## Synchronization Matrix

Whenever you change a behavior, schema, UI screen, or planted defect, update the owning documentation in the same turn:

| Change Area | Documents to Update Together |
|---|---|
| Scope, personas, or canonical business formula | `PROJECT_OVERVIEW.md`, `FRS_NFRS.md`, and `.agents/rules/20-domain-and-folio-math.md` |
| Planted defect (`VH-01`..`VH-60`) behavior or steps | `DEFECT_CATALOG.md`, `FRS_NFRS.md`, `WORKFLOWS.md`, `TESTING.md`, and `Veranda_PMS_Defect_List.docx` (when generated) |
| Database tables, seed items, or `localStorage` keys | `DATABASE.md` and `ARCHITECTURE.md` |
| Routes, query parameters, or form validation rules | `ROUTES_AND_FORMS.md` and `WORKFLOWS.md` |
| Design tokens, typography, layout, or custom components | `DESIGN.md` and `.agents/rules/40-frontend-design-system.md` |
| Auth, session storage, or RBAC rules | `SECURITY_AND_AUDIT.md` and `DEFECT_CATALOG.md` |
| Packages, versions, or build scripts | `TECH_STACK.md` and `DEPLOYMENT_AND_OPS.md` |
| Milestone completion status | `IMPLEMENTATION_PLAN.md`, `AGENTS.md`, and `docs/README.md` |

## Plain-ASCII Formatting Rule (Mandatory)

- **Never use LaTeX syntax or math-mode delimiters** (`$...$`, `$$...$$`, `\(...\)`, `\ge`, `\le`, `\rightarrow`, `\leftarrow`, `\times`, `\approx`, `\pm`) in any Markdown file, code comment, or UI text.
- **Always use plain ASCII operators**: `>=`, `<=`, `->`, `<-`, `*`, `~=`, `+/-`.
- Use portable relative links across repository Markdown files.

## Safe Operational Habits

- Keep `AGENTS.md` as the single canonical entrypoint and keep `CLAUDE.md` and `GEMINI.md` as thin pointers.
- Preserve `docs/example/ShopSphere_Defect_List.docx` and never modify external reference repositories (`D:\repos\Capstone_BGH`, `D:\repos\EHR_System`).
- Do not commit, push, or deploy unless authorized by the user's active request.
