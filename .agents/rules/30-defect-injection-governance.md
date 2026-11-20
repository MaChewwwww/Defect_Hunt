# 30 — Defect Injection Governance

Follow [DEFECT_CATALOG.md](../../docs/DEFECT_CATALOG.md) and the `.agents/skills/defect-injector/SKILL.md` workflow.

## The Golden Rule of Defect Hunt Engineering

In **Veranda PMS**, the 60 defects (`VH-01` through `VH-60`: 5 Easy, 31 Medium, 24 Hard) are **deliberate product specifications**, not mistakes to be cleaned up.
1. **NEVER "fix" or remove any of the 60 planted defects** unless explicitly instructed by the user to modify the defect catalog.
2. **NEVER introduce a 61st undocumented bug.** Every code path that is not explicitly governed by a `VH-XX` defect must follow the canonical rules in [FRS_NFRS.md](../../docs/FRS_NFRS.md).

## Mandatory Code Annotation Convention

Whenever you write or touch code that implements one of the 60 planted defects, you MUST include a structured `@defect` annotation immediately above the defective logic:

```typescript
// @defect VH-40 (Easy | Reservations / list | Functional)
// Expected: Status filter "Checked In" returns only "Checked In" reservations.
// Actual: Also includes "Checked Out" reservations in the filtered result.
```

## Surgical Precision & Blast-Radius Containment

Each planted defect must match its exact `Steps to Reproduce`, `Expected`, and `Actual` contract in [DEFECT_CATALOG.md](../../docs/DEFECT_CATALOG.md) without breaking adjacent features:
- **`VH-02`**: Pressing `Enter` in Password does nothing, **but** pressing `Enter` in Email or clicking `Sign in` MUST submit the form cleanly.
- **`VH-05`**: Password confirmation mismatch on `/register` MUST be caught when `password.length < 12`, and ignored only when `password.length >= 12`.
- **`VH-09`**: Deactivated account `former.groupN@verandapms.test` MUST be blocked when `"Remember me"` is unchecked, and allowed only when `"Remember me"` is ticked.
- **`VH-11` & `VH-27`**: On the `/rooms` list page, `staff` must NOT see a Delete button and `admin` MUST get a confirmation modal before deletion. Only on `/rooms/[id]` (detail page) does `staff` see the Delete button (`VH-11`) and deletion happens immediately without confirmation (`VH-27`).
- **`VH-15`**: Reservation `notes` MUST be safely escaped on `/reservations/[id]` (detail view) and unescaped (`dangerouslySetInnerHTML` / script-triggering image handler) ONLY on `/reservations/[id]/folio`.
- **`VH-25`**: Paginating `/rooms` to Page 2 drops ONLY the `Category` filter; `search`, `status`, and `sort` MUST be preserved across pagination.
- **`VH-26`**: Sorting `/rooms` by `Rate (high to low)` sorts as strings, **but** sorting by `Rate (low to high)` MUST sort numerically.
- **`VH-28`**: Clicking `Cancel` in Edit Room/Package discards changes to `name`, `category`, and `description`, **but** saves the modified `rate`.
- **`VH-34`**: Line quantity `0` and fractional `2.5` are accepted, **but** negative quantities (`< 0`) MUST be rejected.
- **`VH-35`**: A single reservation line with quantity `> available_units` (e.g., `24` when `23` available) MUST be rejected with `"Only 23 available"`, whereas splitting across two lines of `20` each bypasses the check.
- **`VH-36`**: Cancelling a `Pending` reservation (`RSV-2044`) MUST restore allotment, whereas cancelling a `Confirmed` reservation (`RSV-2045`) fails to restore allotment.
- **`VH-56`**: Unknown top-level routes (`/nope`) MUST render a proper 404 Not Found page, whereas unknown dynamic IDs (`/rooms/does-not-exist`, `/reservations/does-not-exist`) render an infinite loading skeleton.
- **`VH-59`**: Icon-only buttons omit accessible labels/tooltips, focus rings are suppressed, and `Escape` does not close modals—**but** sidebar navigation links MUST remain properly labelled (including in the collapsed icon rail).
