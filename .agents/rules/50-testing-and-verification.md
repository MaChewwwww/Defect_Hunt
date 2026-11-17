# 50 — Testing and Verification

Follow [TESTING.md](../../docs/TESTING.md) and `.agents/skills/defect-verification-e2e/SKILL.md`.

## Dual-Mode Verification Strategy

Every verification pass in this repository must validate two things:
1. **Planted Defect Reproduction (`T-VH-01`..`T-VH-60`)**: Every one of the 60 planted defects in [DEFECT_CATALOG.md](../../docs/DEFECT_CATALOG.md) must reproduce deterministically when following its documented Steps to Reproduce.
2. **Canonical Non-Defect Integrity**: All surrounding hospitality workflows, seed calculations, sandbox resets, and role boundaries must function without unintended bugs.

## Testing Rules

- **Documentation-Only Changes**: Verify internal relative Markdown links, table formatting, Mermaid diagram syntax, requirement ID uniqueness (`FR-*`, `NFR-*`), and complete `VH-01`..`VH-60` coverage across `DEFECT_CATALOG.md` and `TESTING.md`. Do not run application test commands before Milestone M1 scaffolding exists.
- **Timezone Consistency (`Asia/Manila`)**: Configure Playwright (`playwright.config.ts`) and Vitest timezone tests to run with `TZ=Asia/Manila` (`UTC+8`) by default so `VH-18` (Dashboard monthly chart UTC bucketing) and `VH-44` (Reservation detail UTC timestamp) are tested under actual PUPQC competition timezone conditions.
- **Isolated Sandbox Reset per Test**: Ensure every Playwright test either starts with a fresh browser storage context or invokes `"Reset demo data"` so mutations from one defect test (such as deleting `Daniel Cruz` in `T-VH-46` or deactivating `Admin` in `T-VH-12`) never pollute subsequent tests.
- **Traceable Test Titles**: Prefix every defect test with its exact catalog ID:
  ```typescript
  test("T-VH-40 (VH-40): Status filter 'Checked In' also lists 'Checked Out' reservations", async ({ page }) => { ... });
  ```
- Report actual commands executed and their outcomes honestly. Never claim a test suite passed without running it.
