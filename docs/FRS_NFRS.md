# Functional and Non-Functional Requirements

**Status:** Canonical specification baseline (Milestone M0).  
**Important Note on Dual-Contract Architecture:** The requirements below define the **Canonical Baseline ("Expected Behavior")** of Veranda PMS. For the PUPQC BSIT *Defect Hunt* competition, exactly 60 specific behaviors are intentionally overridden by the planted defects cataloged in [DEFECT_CATALOG.md](DEFECT_CATALOG.md). Every behavior not explicitly listed in `DEFECT_CATALOG.md` must strictly satisfy the requirements in this document.

---

## 1. Role Capability Matrix (Canonical Baseline)

| Capability | Guest (Unauthenticated) | Staff (`staff`) | Admin (`admin`) | Deactivated (`is_active = false`) |
|---|---|---|---|---|
| Sign in / Register / Request password reset | Yes | Yes | Yes | Blocked at sign-in |
| Reset demo data (per-browser sandbox) | Yes | Yes | Yes | Yes |
| View Dashboard & KPIs | No | Yes | Yes | No |
| View, search, filter, sort Rooms & Packages | No | Yes | Yes | No |
| Create, edit, or adjust allotment of Rooms & Packages | No | Yes | Yes | No |
| Delete a Room or Package | No | **No** | **Yes** | No |
| View, create, and update Reservation status | No | Yes | Yes | No |
| View & print Guest Folio (`/reservations/[id]/folio`) | No | Yes | Yes | No |
| View, create, and edit Guests | No | Yes | Yes | No |
| Delete a Guest (only if Guest has zero reservations) | No | Yes | Yes | No |
| View Occupancy & Revenue Reports & export CSV | No | Yes | Yes | No |
| Access Staff Users page (`/users`) & manage accounts | No | **No** | **Yes** | No |
| Deactivate another user account | No | **No** | **Yes** (never own account) | No |
| Update own Profile, Password, Theme, & Notification settings | No | Yes | Yes | No |

---

## 2. Functional Requirements (`FR-*`)

### Authentication & Session (`FR-AUTH`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-AUTH-01` | Normalize email and authenticate credentials. | Leading/trailing whitespace in email is trimmed; email lookup is case-insensitive; pressing `Enter` in either Email or Password submits the login form. | `VH-01`, `VH-02` |
| `FR-AUTH-02` | Prevent account enumeration and enforce brute-force lockout. | Invalid email and wrong password return the exact same message (`"Invalid email or password."`). After 5 consecutive failed attempts for an email, block sign-in for that account for 5 minutes even if the correct password is entered next. | `VH-03`, `VH-04` |
| `FR-AUTH-03` | Validate registration inputs and uniqueness. | Self-registration rejects duplicate emails case-insensitively and requires `password === confirmPassword` across all password lengths (minimum 8 characters, including 12+ character passwords). | `VH-05`, `VH-06` |
| `FR-AUTH-04` | Block deactivated accounts unconditionally. | Any user with `is_active = false` (`former.groupN@verandapms.test`) is rejected at login regardless of whether `"Remember me"` is checked or unchecked. | `VH-09` |
| `FR-AUTH-05` | Scope session storage according to `"Remember me"`. | When `"Remember me"` is unchecked, session state is scoped to `sessionStorage` (tab-scoped). When checked, session state persists across tabs/restarts. | `VH-08` |
| `FR-AUTH-06` | Enforce single-use password reset tokens. | A password reset token/link generated via Forgot Password expires after 30 minutes and is invalidated immediately upon its first successful password reset. | `VH-07` |
| `FR-AUTH-07` | Store password credentials securely. | User passwords are stored only as cryptographic hashes, never in plaintext inside database records or browser storage. | `VH-14` |

### Users & Role-Based Access Control (`FR-USER`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-USER-01` | Restrict `/users` route and Staff management to Admin. | Navigating to `/users` as `staff` returns an access-denied screen or redirects to `/dashboard`. | `VH-10` |
| `FR-USER-02` | Restrict Room/Package deletion to Admin across all views. | `staff` users see no Delete button on either the `/rooms` list or the `/rooms/[id]` detail page, and deletion mutations verify `role === 'admin'`. | `VH-11` |
| `FR-USER-03` | Resolve user role from authoritative user record. | Client-side tampering with stored session role values in `localStorage` does not grant Admin navigation or Admin deletion controls. | `VH-13` |
| `FR-USER-04` | Prevent Admin self-deactivation. | In `/users`, the Deactivate button on the currently signed-in Admin's own row is disabled and the backend rejects self-deactivation. | `VH-12` |

### Executive Dashboard (`FR-DASH`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-DASH-01` | Calculate Total Revenue and ABV accurately for selected period. | Total Revenue sums `grand_total` of non-cancelled reservations within the selected date range (inclusive of today). `ABV = Non-Cancelled Revenue / Non-Cancelled Count`. | `VH-16`, `VH-19`, `VH-20` |
| `FR-DASH-02` | Synchronize Low Allotment KPI count and watchlist rows. | Both the Low Allotment KPI card and the Low Allotment Watchlist table include all rooms/packages with `available_units <= 5`. | `VH-17` |
| `FR-DASH-03` | Group monthly chart bars by local browser timezone (`Asia/Manila`). | A reservation placed at `12:30 AM` local time on the 1st of a month is bucketed into that calendar month's bar, matching `/reports`. | `VH-18` |

### Rooms & Packages Inventory (`FR-ROOM`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-ROOM-01` | Validate Room/Package form fields. | Name cannot be blank or whitespace-only (`"Enter a room or package name."`). Nightly/unit rate must be `> 0`. Initial/edited `available_units` cannot be negative (`"Allotment cannot be negative."`). Room code (`SB-XXXX`) uniqueness is enforced case-insensitively. | `VH-21`, `VH-22`, `VH-23` |
| `FR-ROOM-02` | Preserve active filters, sort, and search across pagination. | Filtering by Category (e.g., `Villas & Suites`, 12 items) and clicking Page 2 displays the remaining items in that category rather than resetting the category filter. | `VH-25` |
| `FR-ROOM-03` | Sort Room/Package rates numerically. | Sorting by `Rate (high to low)` and `Rate (low to high)` orders records by numeric `rate`, never lexicographical string order. | `VH-26` |
| `FR-ROOM-04` | Require confirmation before deleting a Room/Package and discard unsaved edits on Cancel. | Clicking Delete on both `/rooms` and `/rooms/[id]` prompts a confirmation dialog. Clicking Cancel in the Edit Room dialog discards all field changes without mutating state. | `VH-27`, `VH-28` |
| `FR-ROOM-05` | Validate allotment adjustments against available units. | Removing/releasing more units to maintenance than currently in `available_units` is rejected with a validation error so `available_units` never becomes negative. | `VH-30` |

### Reservations & Folio Lifecycle (`FR-RSV` & `FR-FOLIO`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-RSV-01` | Snapshot unit rates at reservation creation time. | Each reservation line item stores `unit_rate_at_booking`. Later edits to a Room/Package rate in `/rooms` do not alter existing reservations, Dashboard totals, or Reports. | `VH-29` |
| `FR-RSV-02` | Enforce allotment availability during reservation creation. | Out-of-allotment items (`available_units === 0`) cannot be booked. Quantities must be whole integers `>= 1`. If the same Room/Package is added across multiple lines, the combined quantity is validated against `available_units`. | `VH-31`, `VH-34`, `VH-35` |
| `FR-RSV-03` | Calculate discount, 12% VAT, and Service Fee accurately. | `Discount %` is validated within `0` to `100`. `12% VAT` is computed on `(Subtotal - Discount Amount)`, not on gross `Subtotal`. `Grand Total = (Subtotal - Discount) + VAT + 250.00`. | `VH-32`, `VH-33`, `VH-39` |
| `FR-RSV-04` | Enforce forward-only reservation state machine and single allotment deduction. | Allowed transitions: `Pending -> Confirmed -> Checked In -> Checked Out`, plus `Pending/Confirmed -> Cancelled`. `Checked Out` and `Cancelled` are terminal. Allotment is deducted once at creation, unchanged on `Pending -> Confirmed`, and restored when cancelled from either `Pending` or `Confirmed`. | `VH-36`, `VH-37`, `VH-38` |
| `FR-RSV-05` | Filter reservations accurately and prevent duplicate submission. | Filtering by status `"Checked In"` returns only `Checked In` rows (excluding `Checked Out`). Submitting `"Create Reservation"` disables the button during flight so double-clicking creates only one reservation. | `VH-40`, `VH-41` |
| `FR-RSV-06` | Validate reservation dates and format timestamps consistently in local time. | Booking/record date cannot be set in the future for historical log creation, and all views display `MM/DD/YYYY` in local time (`Asia/Manila`) rather than shifting to UTC or `DD/MM/YYYY`. | `VH-42`, `VH-44` |
| `FR-FOLIO-01` | Render accurate, XSS-safe Guest Folios. | `/reservations/[id]/folio` escapes all special request/folio notes as plain text, displays the Guest's full name in `"Billed To"`, and includes the `250.00` Service & Environmental Fee in the Grand Total. | `VH-15`, `VH-43` |

### Guests Directory (`FR-GUEST`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-GUEST-01` | Validate guest contact fields. | Guest phone numbers allow only digits, spaces, `+`, `-`, and parentheses. | `VH-45` |
| `FR-GUEST-02` | Protect referential integrity between Guests and Reservations. | Guests with existing reservations cannot be deleted (or reservations retain snapshot guest identity), and guest detail history matches strictly by `guest_id` rather than first name. | `VH-46`, `VH-47` |

### Occupancy & Revenue Reports (`FR-REP`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-REP-01` | Validate report date range bounds. | Setting `End Date < Start Date` displays a validation error and renders no table rows. | `VH-48` |
| `FR-REP-02` | Calculate Report Total Revenue consistently with Dashboard. | Report summary `Total Revenue` includes the `250.00` Service & Environmental Fee per non-cancelled reservation (`Net Subtotal + VAT + 250.00`). | `VH-51` |
| `FR-REP-03` | Export complete, RFC-4180 compliant CSV files. | CSV export quotes fields containing commas (e.g., `"Cabana Suite, Poolside"`) and exports all rows matching the active range without dropping the final row. | `VH-49`, `VH-50` |

### Workspace Settings, UI, & Cross-Tab Concurrency (`FR-SET` & `FR-UI`)

| ID | Requirement | Canonical Acceptance Criterion | Related Planted Defects |
|---|---|---|---|
| `FR-SET-01` | Verify current password before password update. | Settings > Change Password verifies `currentPassword` against the user's active password before saving the new password. | `VH-52` |
| `FR-SET-02` | Persist theme preference and immediately reflect profile/notification changes. | Switching to Light mode persists across page reloads. Updating Full Name immediately updates topbar/dashboard greetings. Disabling Low Allotment Alerts hides both dropdown items and the bell count badge. | `VH-53`, `VH-54`, `VH-55` |
| `FR-UI-01` | Handle missing dynamic routes, long names, mobile navigation, copy spelling, and accessibility. | Unknown `/rooms/[id]` or `/reservations/[id]` renders a 404 empty state instead of an infinite skeleton. Long room names wrap cleanly in reservation builder. Mobile drawer closes on route link tap. Icon buttons have accessible names/tooltips, visible focus rings, and `Escape` modal dismissal. | `VH-24`, `VH-56`, `VH-57`, `VH-58`, `VH-59` |
| `FR-DATA-01` | Detect concurrent stale edits across browser tabs. | Saving a Room/Package or Guest in Tab B after Tab A already updated the record warns of a version conflict (`version` mismatch) instead of silently overwriting Tab A's changes. | `VH-60` |
| `FR-SANDBOX-01` | Provide one-click per-browser sandbox reset. | Clicking `"Reset demo data"` resets the current browser's Supabase `sandbox_id` slice and local storage mirror to the canonical seed dataset within 2 seconds. | None (Core competition infrastructure) |

---

## 3. Non-Functional Requirements (`NFR-*`)

| ID | Category | Requirement & Measurable Target |
|---|---|---|
| `NFR-PERF-01` | Performance | Initial page load and route transitions complete in `<= 1.5s` p95 on Vercel; `"Reset demo data"` completes in `<= 2.0s`. |
| `NFR-ISOL-01` | Multi-Contestant Isolation | 50+ concurrent contestants at PUPQC can create, mutate, delete, and reset data simultaneously without cross-browser interference via `sandbox_id` scoping. |
| `NFR-DEFECT-01` | Defect Determinism | All 60 planted defects (`VH-01`..`VH-60`) are 100% reproducible on a freshly reset sandbox and covered by automated Playwright/Vitest assertions. |
| `NFR-DEFECT-02` | Zero Unplanned Regressions | No unintentional 61st defect exists outside `DEFECT_CATALOG.md`. All non-defect flows adhere strictly to `FRS_NFRS.md`. |
| `NFR-UX-01` | Responsive Layout | Application shell supports desktop (`1440px`), tablet (`768px`), and mobile (`390px`) viewports (except where `VH-24` and `VH-58` intentionally test specific layout/drawer behaviors). |
| `NFR-PRINT-01` | Print Fidelity | `/reservations/[id]/folio` renders a clean A4/Letter hospitality statement under `@media print` with navigation rails and action buttons hidden. |
| `NFR-DOC-01` | Documentation Parity | Every schema table, route, business formula, and planted defect ID is synchronized across `docs/` and `.agents/`. |
