---
name: defect-injector
description: Guides implementing, auditing, and isolating the 60 intentional planted defects (VH-01 through VH-60) in Veranda PMS so each defect reproduces deterministically without breaking unrelated features.
---

# Defect Injector & Auditor Skill

When implementing any module in **Veranda PMS** or auditing defect coverage against `docs/DEFECT_CATALOG.md`, follow this skill to guarantee 100% fidelity to the 60 competition defects (`5 Easy`, `31 Medium`, `24 Hard`).

## 1. Lookup & Pre-Check

Before coding a page, form, or store action:
1. Search `docs/DEFECT_CATALOG.md` for every row whose **Module / Page** touches the feature you are building (`Auth`, `Users`, `Dashboard`, `Rooms & Packages`, `Reservations`, `Folio`, `Guests`, `Reports`, `Settings`, `Notifications`, `Routing`, `Layout`, `Accessibility`).
2. Read the exact **Steps to Reproduce**, **Expected**, and **Actual** columns for each matching `VH-XX` defect.

## 2. Implementation & Annotation Pattern

Never hide planted defects inside unmarked logic. Always annotate each planted defect with a clear `@defect` comment block:

```typescript
// @defect VH-32 (Hard | Reservations / totals | Functional)
// Steps: Create reservation with discount > 0 (or open RSV-2044 with 5% discount).
// Expected: Tax = 12% of (subtotal - discountAmount).
// Actual: Tax is calculated as 12% of gross subtotal before discount.
const taxAmount = Number((subtotal * 0.12).toFixed(2));
```

## 3. Critical Contrasts to Preserve

Many defects in `docs/DEFECT_CATALOG.md` explicitly require a **contrast** between a working path and a broken path so contestants can prove the bug:

| Defect ID | Working Path (Must Succeed) | Defective Path (Must Reproduce Bug) |
|---|---|---|
| `VH-02` | Pressing `Enter` in the **Email** field submits Login. | Pressing `Enter` in the **Password** field does nothing. |
| `VH-05` | Password mismatch `< 12` chars (`Password1` / `Password2`) shows `"Passwords do not match"`. | Password mismatch `>= 12` chars (`LongPassword12` / `Different12345`) creates the account. |
| `VH-06` | Registering `admin.group1@verandapms.test` (exact case) is rejected. | Registering `Admin.group1@verandapms.test` (capital A) is accepted. |
| `VH-09` | `former.group1@verandapms.test` with `"Remember me"` **unchecked** is blocked. | `former.group1@verandapms.test` with `"Remember me"` **checked** logs in. |
| `VH-10` | Sidebar hides `Users` menu item for `staff`. | Navigating directly to `/users` as `staff` opens the functional page. |
| `VH-11` & `VH-27` | `/rooms` list hides Delete for `staff` and shows confirmation dialog for `admin`. | `/rooms/[id]` detail page shows Delete for `staff` (`VH-11`) and deletes immediately without confirmation (`VH-27`). |
| `VH-15` | Reservation `notes` with `<img src=x onerror="alert(1)">` render as safe text on `/reservations/[id]`. | Clicking `"View folio"` (`/reservations/[id]/folio`) executes the `onerror` alert. |
| `VH-22` | Adding room code `SB-1001` (exact case) is rejected. | Adding room code `sb-1001` (lowercase) is accepted. |
| `VH-25` | Pagination on `/rooms` keeps `search`, `status`, and `sort`. | Pagination on `/rooms` drops the `Category` filter on page 2. |
| `VH-26` | Sorting `/rooms` by `Rate (low to high)` sorts numerically. | Sorting `/rooms` by `Rate (high to low)` sorts lexicographically as text. |
| `VH-28` | Clicking `Cancel` on Edit Room discards changes to `Name`. | Clicking `Cancel` on Edit Room still saves changes to `Rate`. |
| `VH-34` | Negative line quantities (`< 0`) are rejected on Create Reservation. | Quantity `0` and fractional `2.5` are accepted. |
| `VH-35` | Single line of `24` for `Island Kayaking` (`23` available) is rejected (`"Only 23 available"`). | Two separate lines of `20` each for `Island Kayaking` are accepted (`-17`). |
| `VH-36` | Cancelling `Pending` reservation `RSV-2044` restores allotment. | Cancelling `Confirmed` reservation `RSV-2045` leaves allotment unchanged. |
| `VH-39` | `/reservations` list displays `1,370.00` for `RSV-2045`. | `/reservations/rsv-2045` detail displays `1,620.00` (`250.00` fee added twice). |
| `VH-44` | `/reservations` list shows local time (`Asia/Manila`). | `/reservations/[id]` detail `"Placed ..."` shows UTC time. |
| `VH-47` | `/guests` list shows `Maria Santos = 6`, `Maria Reyes = 3`. | `/guests/[id]` detail matches by first name `"Maria"`, showing `9` on both. |
| `VH-56` | Unknown top-level route `/nope` renders the 404 Not Found page. | Unknown dynamic ID `/rooms/does-not-exist` renders an infinite skeleton. |

## 4. Audit Checklist

Run a grep search for `@defect VH-` across `src/` to verify that all 60 defect IDs (`VH-01` through `VH-60`) are present and accounted for before marking Milestone M5/M6 complete.
