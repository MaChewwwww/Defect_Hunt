# 70 — Commit Conventions

Use Conventional Commits for every commit in this repository:

```text
type(scope): short imperative description
```

Write the subject in English, use lowercase `type` and `scope`, omit the trailing period, and keep the subject line within 72 characters.

## Allowed Types and Scopes

| Type | Use For |
|---|---|
| `feat` | New user-facing hospitality functionality or UI module. |
| `defect` | Implementing or tuning an intentional planted defect (`VH-01`..`VH-60`). |
| `fix` | Fixing an unintended bug outside the 60 planted defects. |
| `docs` | Documentation, `.agents/rules/`, `.agents/skills/`, or handout updates. |
| `test` | Adding or updating Vitest unit tests or Playwright E2E tests (`T-VH-XX`). |
| `refactor` | Code restructuring without changing canonical or planted-defect behavior. |
| `style` | Formatting or CSS token refinements without behavior changes. |
| `build` | Dependencies (`package.json`, `pnpm-lock.yaml`), Next.js, or Supabase build config. |
| `chore` | Repository maintenance and scripts. |

Preferred scopes: `auth`, `dashboard`, `rooms`, `reservations`, `folio`, `guests`, `reports`, `users`, `settings`, `sandbox`, `supabase`, `ui`, `defects`, `e2e`, `agents`.

### Examples

```text
docs(agents): initialize Veranda PMS specification and agent rules
feat(sandbox): add Supabase reset RPC and localStorage hybrid store
defect(reservations): plant VH-32 pre-discount VAT calculation and VH-39 double fee
test(e2e): verify planted defects T-VH-01 through T-VH-20 in Playwright
```

## Verification & Hygiene Before Committing

1. Inspect `git status` and `git diff --staged` before creating a commit.
2. Never commit `.env.local`, real Supabase service-role keys, `.next/` build output, `node_modules/`, or Playwright trace artifacts (`test-results/`, `playwright-report/`).
3. Include related documentation and test updates in the same coherent commit as code changes.
4. Commit or push only when requested by the user.
