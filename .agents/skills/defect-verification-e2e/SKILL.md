---
name: defect-verification-e2e
description: Creates and executes Playwright E2E and Vitest tests (T-VH-01 through T-VH-60) that verify every planted defect in Veranda PMS reproduces deterministically under Asia/Manila timezone.
---

# Defect Verification E2E Skill

Use this skill when writing or running automated Vitest unit tests (`tests/unit/`) or Playwright E2E browser tests (`tests/e2e/`) for **Veranda PMS**.

## 1. Traceability Requirement

Every test in `tests/e2e/defects/` MUST map 1-to-1 to a test case ID `T-VH-01` through `T-VH-60` in `docs/TESTING.md` and `docs/DEFECT_CATALOG.md`:

```typescript
import { test, expect } from "@playwright/test";

test("T-VH-39 (VH-39): Reservation detail adds 250.00 service fee twice compared to list", async ({ page }) => {
  // 1. Sign in or use seeded sandbox state
  // 2. Check RSV-2045 total in /reservations list (1,370.00)
  // 3. Open /reservations/rsv-2045 detail page and assert displayed total is 1,620.00
});
```

## 2. Mandatory Browser Context Configuration

1. **Timezone (`Asia/Manila`)**:
   Ensure `playwright.config.ts` sets `timezoneId: "Asia/Manila"` (`UTC+8`). Never run `T-VH-18` or `T-VH-44` under `UTC`, as `docs/DEFECT_CATALOG.md` specifies that `VH-18` and `VH-44` only manifest when the browser timezone is ahead of/not `UTC`.
2. **Viewport Isolation**:
   - Run `T-VH-58` (`Layout / mobile drawer`) with ` page.setViewportSize({ width: 390, height: 844 })`.
   - Run `T-VH-24` (`Reservations / Create horizontal overflow`) at desktop width (`1280x800` or `1440x900`) and assert that adding `SB-1009` causes the line-item container's `scrollWidth > clientWidth`.
3. **Clean Sandbox State per Test**:
   - Before each test that mutates data (`T-VH-11`, `T-VH-12`, `T-VH-27`, `T-VH-28`, `T-VH-29`, `T-VH-30`, `T-VH-36`, `T-VH-38`, `T-VH-41`, `T-VH-46`, `T-VH-52`, `T-VH-60`), start with a fresh browser context or click `"Reset demo data"` on `/login` so every test starts from the exact canonical seed dataset.

## 3. Grouping E2E Spec Files by Module

Organize `tests/e2e/defects/` cleanly by module:
- `tests/e2e/defects/auth-and-session.spec.ts` (`VH-01`..`VH-09`, `VH-13`, `VH-14`)
- `tests/e2e/defects/access-and-users.spec.ts` (`VH-10`, `VH-11`, `VH-12`)
- `tests/e2e/defects/dashboard.spec.ts` (`VH-16`..`VH-20`)
- `tests/e2e/defects/rooms-packages.spec.ts` (`VH-21`..`VH-23`, `VH-25`..`VH-28`, `VH-30`)
- `tests/e2e/defects/reservations-and-folio.spec.ts` (`VH-15`, `VH-24`, `VH-29`, `VH-31`..`VH-44`)
- `tests/e2e/defects/guests-and-concurrency.spec.ts` (`VH-45`, `VH-46`, `VH-47`, `VH-60`)
- `tests/e2e/defects/reports-and-csv.spec.ts` (`VH-48`..`VH-51`)
- `tests/e2e/defects/settings-ui-a11y.spec.ts` (`VH-52`..`VH-59`)
