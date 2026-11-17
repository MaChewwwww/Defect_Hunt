# Testing and Verification Specification

**Status:** Approved verification baseline (Milestone M0).  
**Test Frameworks:** Vitest (`tests/unit/`) + Playwright with Chromium (`tests/e2e/`).

---

## 1. Dual-Contract Verification Philosophy

Unlike a standard application where tests only assert defect-free behavior, **Veranda PMS** is a competition platform for the **PUPQC BSIT Foundation Month "Defect Hunt"**. Therefore, our automated test suite enforces two simultaneous contracts:

1. **Planted Defect Reproduction Suite (`tests/e2e/defects/` & `tests/unit/defects/`)**:
   - Every single planted defect (`VH-01` through `VH-60`) has a dedicated, deterministic test case (`T-VH-01` to `T-VH-60`) that executes the exact **Steps to Reproduce** from [DEFECT_CATALOG.md](DEFECT_CATALOG.md) and asserts that the **Actual (Defective)** behavior occurs reliably!
   - If an agent or developer accidentally fixes a planted defect, the corresponding `T-VH-XX` test fails immediately.
2. **Canonical Boundary & Sandbox Isolation Suite (`tests/e2e/canonical/` & `tests/unit/canonical/`)**:
   - Asserts that all non-defect workflows (such as ascending price sort, cancelling a `Pending` reservation restoring allotment, validating positive room rates, resetting demo data, and isolating concurrent browser sandboxes) work cleanly without unintended 61st bugs.

---

## 2. Playwright Browser Configuration (`playwright.config.ts`)

- **Timezone Emulation**: By default, Playwright projects run with `timezoneId: 'Asia/Manila'` (`UTC+8`) so that timezone-dependent defects (`VH-18` and `VH-44`) are verified automatically under actual Philippine competition conditions.
- **Viewport Profiles**:
  - Desktop project: `1440 x 900` (default for `VH-01`..`VH-57`, `VH-59`, `VH-60`).
  - Mobile project: `390 x 844` (used to verify `VH-58` mobile drawer stays open on route click).
- **Per-Test Sandbox Reset**: Each Playwright test starts with a clean browser context or clicks `"Reset demo data"` on `/login` so no test pollutes another test's `sandbox_id`.

---

## 3. Complete Traceability Matrix (`T-VH-01` to `T-VH-60`)

| Test ID | Defect ID | Tier | Automated Assertion Summary |
|---|---|---|---|
| `T-VH-01` | `VH-01` | Medium | Submitting `" admin@verandapms.test "` with `Admin@123` stays on `/login` and shows `"Invalid email or password."` |
| `T-VH-02` | `VH-02` | Medium | Focusing Password input and pressing `Enter` does not submit; focusing Email input and pressing `Enter` submits and redirects to `/dashboard`. |
| `T-VH-03` | `VH-03` | Medium | `nobody@verandapms.test` shows `"Invalid email or password."`; `admin@verandapms.test` with wrong password shows `"Incorrect email or password."` |
| `T-VH-04` | `VH-04` | Hard | After 5 failed attempts on `admin@verandapms.test` showing `"Too many attempts, try again later."`, submitting `Admin@123` on attempt 6 succeeds immediately. |
| `T-VH-05` | `VH-05` | Hard | `/register` with `Password1` / `Password2` (length 9) fails with `"Passwords do not match"`; `LongPassword12` / `Different12345` (length 14) succeeds. |
| `T-VH-06` | `VH-06` | Medium | `/register` with `admin@verandapms.test` fails as duplicate; `Admin@verandapms.test` succeeds. |
| `T-VH-07` | `VH-07` | Hard | `/forgot-password` for `staff@verandapms.test` -> open reset link -> set password -> revisit same reset link URL -> set password again succeeds. |
| `T-VH-08` | `VH-08` | Medium | Login with `"Remember me"` unchecked writes `veranda.v1.session` to `localStorage` and `sessionStorage` is empty; new tab is already authenticated. |
| `T-VH-09` | `VH-09` | Medium | Login as `former@verandapms.test` / `Former@123` fails when `"Remember me"` is unchecked, but succeeds when `"Remember me"` is checked. |
| `T-VH-10` | `VH-10` | Medium | Logged in as `staff`, sidebar has no `Users` link, but `page.goto('/users')` renders the full Users management table and controls. |
| `T-VH-11` | `VH-11` | Medium | Logged in as `staff`, `/rooms` rows have no Delete button, but `/rooms/rm-1001` renders a working `Delete` button. |
| `T-VH-12` | `VH-12` | Medium | Logged in as `admin`, clicking `Deactivate` on `Elena Marasigan` in `/users` deactivates the account and signs out on reload. |
| `T-VH-13` | `VH-13` | Hard | Logged in as `staff`, mutating `veranda.v1.session` in `localStorage` to `"role":"admin"` and reloading exposes `/users` link and `/rooms` delete buttons. |
| `T-VH-14` | `VH-14` | Hard | Reading `localStorage.getItem('veranda.v1.db')` reveals plaintext `"password":"Admin@123"` in `users`. |
| `T-VH-15` | `VH-15` | Hard | Reservation created with notes `<img src=x onerror="alert(1)">` shows escaped text on `/reservations/[id]` and triggers `dialog` alert on `/reservations/[id]/folio`. |
| `T-VH-16` | `VH-16` | Medium | Dashboard `"Last 30 days"` Total Revenue equals non-cancelled sum PLUS cancelled `RSV-2037` total. |
| `T-VH-17` | `VH-17` | Hard | Dashboard Low Allotment KPI displays `8`, while Low Allotment table renders `7` rows (omitting `Coral Reef Private Cabana` with allotment `5`). |
| `T-VH-18` | `VH-18` | Hard | Under `Asia/Manila` (`UTC+8`), the reservation placed at `12:30 AM` on the 1st of last month is counted in the prior UTC month's chart bar. |
| `T-VH-19` | `VH-19` | Medium | Dashboard `"Last 7 days"` Reservations KPI excludes the 3 reservations placed today (`RSV-2043`, `RSV-2044`, `RSV-2045`). |
| `T-VH-20` | `VH-20` | Hard | Dashboard `"Last 30 days"` Average Booking Value divides revenue by total reservation count including `Cancelled` (`RSV-2037`). |
| `T-VH-21` | `VH-21` | Medium | Creating or editing a room/package with Allotment `-7` saves `-7` without validation error. |
| `T-VH-22` | `VH-22` | Medium | Creating a room/package with Code `sb-1001` succeeds despite `SB-1001` existing. |
| `T-VH-23` | `VH-23` | Easy | Creating a room/package with Name `"   "` saves a blank-looking name. |
| `T-VH-24` | `VH-24` | Medium | Selecting `SB-1009` in `/reservations/new` causes the line item container `scrollWidth > clientWidth`. |
| `T-VH-25` | `VH-25` | Medium | Filtering `/rooms` by `Category = Villas & Suites` (12 items) and clicking page `2` drops the category filter and lists 10 unfiltered page-2 items. |
| `T-VH-26` | `VH-26` | Hard | Sorting `/rooms` by `Rate (high to low)` orders lexicographically (`990.00` before `6,400.00`); `Rate (low to high)` orders numerically. |
| `T-VH-27` | `VH-27` | Medium | Deleting from `/rooms` opens a confirmation dialog; clicking `Delete` on `/rooms/[id]` deletes immediately without confirmation. |
| `T-VH-28` | `VH-28` | Hard | Editing `"Eucalyptus Steam & Spa Ritual"` name and changing Rate to `555`, then clicking `Cancel`, discards the name change but persists Rate `555`. |
| `T-VH-29` | `VH-29` | Hard | Changing `Teakwood Lanai Daybed` rate in `/rooms` mutates the unit price and total of existing reservation `RSV-2045`. |
| `T-VH-30` | `VH-30` | Medium | Adjusting allotment on `Terracotta Courtyard Suite` (`7` available) with `Remove` `50` succeeds and sets allotment to `-43`. |
| `T-VH-31` | `VH-31` | Medium | In `/reservations/new`, out-of-allotment `Cliffside Infinity Pavilion` (`0` available) can be added and booked, setting allotment negative. |
| `T-VH-32` | `VH-32` | Hard | Booking `Sunset Catamaran Charter` x2 (`2,400.00`) with `10%` discount calculates VAT as `12%` of `2,400.00` (`288.00`) instead of `259.20`. |
| `T-VH-33` | `VH-33` | Medium | `/reservations/new` accepts Discount `150` and `-20`. |
| `T-VH-34` | `VH-34` | Medium | `/reservations/new` accepts line quantity `0` and `2.5` (producing fractional allotment). |
| `T-VH-35` | `VH-35` | Hard | Adding `Island Kayaking & Snorkeling Expedition` (`23` available) twice with quantity `20` each succeeds and sets allotment to `-17`. |
| `T-VH-36` | `VH-36` | Hard | Cancelling `RSV-2045` (`Confirmed`) leaves `Teakwood Lanai Daybed` allotment at `26` instead of restoring to `28`. |
| `T-VH-37` | `VH-37` | Medium | `Checked Out` and `Cancelled` (`RSV-2037`) reservations offer backward/reopen statuses in the status dropdown. |
| `T-VH-38` | `VH-38` | Hard | Changing `RSV-2043` from `Pending` to `Confirmed` deducts `Cabana Suite, Poolside` (`34 -> 33`) and `Botanical Welcome Amenity Set` (`96 -> 93`) a second time. |
| `T-VH-39` | `VH-39` | Medium | `RSV-2045` shows `1,370.00` in `/reservations` list, but `/reservations/rsv-2045` detail page shows `1,620.00` (`250.00` fee added twice). |
| `T-VH-40` | `VH-40` | Easy | Filtering `/reservations` by `"Checked In"` returns both `Checked In` and `Checked Out` reservations. |
| `T-VH-41` | `VH-41` | Medium | Double-clicking `"Place Reservation"` creates two consecutive reservations and deducts allotment twice. |
| `T-VH-42` | `VH-42` | Medium | Future reservation date is accepted on `/reservations/new`, and `/reservations/[id]` formats the date as `DD/MM/YYYY`. |
| `T-VH-43` | `VH-43` | Hard | `/reservations/rsv-2045/folio` shows Grand Total `1,120.00` (omitting `250.00` fee) and omits `"Maria Reyes"` from `"Billed to"`. |
| `T-VH-44` | `VH-44` | Hard | Under `Asia/Manila` (`UTC+8`), `/reservations/[id]` `"Placed ..."` timestamp displays UTC time (8 hours behind list view). |
| `T-VH-45` | `VH-45` | Easy | Adding/editing a guest with phone `abc!!##xyz` is accepted. |
| `T-VH-46` | `VH-46` | Medium | Deleting guest `Daniel Cruz` succeeds; his reservations in `/reservations` show an empty Guest cell linking to a blank page. |
| `T-VH-47` | `VH-47` | Hard | `/guests/gst-01` (`Maria Santos`, 6 bookings) and `/guests/gst-02` (`Maria Reyes`, 3 bookings) each list `9` bookings. |
| `T-VH-48` | `VH-48` | Easy | Setting `End date < Start date` on `/reports` displays no error and shows all reservations across all dates. |
| `T-VH-49` | `VH-49` | Hard | Exporting CSV containing `"Cabana Suite, Poolside"` outputs unquoted `Cabana Suite, Poolside`, shifting columns. |
| `T-VH-50` | `VH-50` | Hard | Exporting CSV on `/reports` outputs `N - 1` data rows (omitting the last/oldest reservation row in the range, e.g., `RSV-2040`). |
| `T-VH-51` | `VH-51` | Hard | `/reports` summary `"Total Revenue"` equals `Subtotal - Discounts + Tax` (excluding `250.00` fee per reservation). |
| `T-VH-52` | `VH-52` | Medium | `Settings > Change password` with a wrong current password still updates the password. |
| `T-VH-53` | `VH-53` | Easy | Switching to Light mode and refreshing the page reverts the app to Dark mode. |
| `T-VH-54` | `VH-54` | Medium | Updating `Full name` in `Settings > Profile` leaves the old name/initials in the topbar until page reload. |
| `T-VH-55` | `VH-55` | Hard | Turning `"Low allotment alerts"` off in Settings clears the bell dropdown items but leaves the badge `8` on the bell icon. |
| `T-VH-56` | `VH-56` | Medium | `/rooms/does-not-exist` and `/reservations/does-not-exist` render infinite skeletons, while `/nope` renders the 404 screen. |
| `T-VH-57` | `VH-57` | Medium | Verifies all 5 exact typos: `"No custmers match your search"`, `"Thank you for your purchse"`, `"Room succesfully updated."`, `"Stock adjusment recorded."`, `"Reservation status udpated."` |
| `T-VH-58` | `VH-58` | Medium | At `390px` viewport, opening the mobile drawer and tapping `Reservations` navigates underneath while the drawer remains open. |
| `T-VH-59` | `VH-59` | Medium | Verifies icon-only buttons have no accessible name/tooltip, buttons/links have no visible focus ring, and `Escape` does not close modals. |
| `T-VH-60` | `VH-60` | Hard | Editing the same room/guest in two tabs (`Tab A` saves description, `Tab B` saves name) silently overwrites `Tab A`'s description. |

---

## 4. Verification Commands (Milestone M1+)

Once the Next.js + Vitest + Playwright toolchain is initialized in Milestone M1:

```powershell
# Typecheck and lint
corepack pnpm typecheck
corepack pnpm lint

# Run unit tests (Folio math, seed determinism, defect unit hooks)
corepack pnpm test

# Production build check
corepack pnpm build

# Run full Playwright E2E suite (all 60 planted defects + sandbox reset)
corepack pnpm test:e2e
```
