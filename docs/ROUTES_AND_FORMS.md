# Routes and Form Contracts

**Status:** Approved baseline (Milestone M0).  
**Framework:** Next.js 16 App Router (`src/app/`) + Route Handlers (`src/app/api/`).

---

## 1. Public & Authentication Routes (`src/app/(auth)/`)

| Path | Purpose | Primary Form Fields & Controls | Canonical Behavior & Defect Notes |
|---|---|---|---|
| `/` | Root redirect | None | Redirects unauthenticated visitors to `/login`; authenticated users to `/dashboard`. |
| `/login` | Sign in & Demo Account reference | `email`, `password`, `rememberMe` checkbox, `Sign in` button, `Reset demo data` footer link | Canonical: trims email, submits on `Enter` in any field, generic error message, enforces 5-attempt lockout, blocks inactive accounts. Defects: `VH-01`, `VH-02`, `VH-03`, `VH-04`, `VH-08`, `VH-09`. |
| `/register` | Self-service Staff registration | `name`, `email`, `password`, `confirmPassword`, `Create account` button | Canonical: case-insensitive email uniqueness, enforces `password === confirmPassword` for all lengths. Defects: `VH-05`, `VH-06`. |
| `/forgot-password` | Request password reset link | `email`, `Send reset link` button -> displays simulated `"Open reset link"` banner | Generates a 30-minute reset token (`token`) and provides a direct link to `/reset-password?token=...`. |
| `/reset-password` | Set new password via token | `token` (query param), `password`, `confirmPassword` | Canonical: single-use token invalidated upon first password change. Defect: `VH-07` allows reusing the same link until 30-minute expiry. |

---

## 2. Authenticated Workspace Routes (`src/app/(workspace)/`)

All workspace routes render inside the responsive shell (248px collapsible sidebar rail on desktop, 64px icon rail on tablet, slide-over drawer on mobile `< 640px`, 56px sticky topbar, and sandbox footer).

| Path | Access (Canonical) | Query Parameters / Filters | Primary Actions & Defect Exceptions |
|---|---|---|---|
| `/dashboard` | `admin`, `staff` | `range` (`7d`, `30d`, `90d`, `all`) | Renders 4 KPI cards (`Total Revenue`, `Reservations`, `Average Booking Value`, `Low Allotment`), 6-month Bar Chart, and Low Allotment Watchlist. Defects: `VH-16`, `VH-17`, `VH-18`, `VH-19`, `VH-20`. |
| `/rooms` | `admin`, `staff` | `q` (search), `category`, `status`, `sort` (`name-asc`, `rate-asc`, `rate-desc`, `allotment-asc`), `page` | Paginated catalog (10 per page). Actions: `Add Room / Package`, `Edit`, `Adjust Allotment`, `Delete` (`admin` only, with confirmation). Defects: `VH-21`, `VH-22`, `VH-23`, `VH-25`, `VH-26`, `VH-28`, `VH-30`, `VH-60`. |
| `/rooms/[id]` | `admin`, `staff` | Dynamic route param `id` (`rm-1001`..`rm-1020`) | Room/Package detail view, allotment adjustment history, `Edit`, `Adjust Allotment`, and `Delete`. Defects: `VH-11` (`staff` sees and can click `Delete`), `VH-27` (`Delete` executes immediately without confirmation), `VH-56` (unknown `id` renders infinite skeleton). |
| `/reservations` | `admin`, `staff` | `q` (search), `status` (`all`, `Pending`, `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`), `page` | Paginated reservations list (`RSV-2001`..`RSV-2045`). Actions: `Create Reservation`, row click to `/reservations/[id]`. Defect: `VH-40` (filtering by `"Checked In"` also lists `"Checked Out"` rows). |
| `/reservations/new` | `admin`, `staff` | None | Multi-line Reservation Builder. Fields: `guestId`, `placedDate`, `items[]` (`roomPackageId`, `quantity`), `discountPercent`, `notes`. Defects: `VH-24`, `VH-31`, `VH-32`, `VH-33`, `VH-34`, `VH-35`, `VH-41`, `VH-42`. |
| `/reservations/[id]` | `admin`, `staff` | Dynamic route param `id` (`rsv-2001`..`rsv-2045`) | Reservation detail, status selector (`Pending`, `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`), itemized charges, and `View Folio / Invoice` link. Defects: `VH-29`, `VH-36`, `VH-37`, `VH-38`, `VH-39`, `VH-42`, `VH-44`, `VH-56`. |
| `/reservations/[id]/folio` | `admin`, `staff` | Dynamic route param `id` | Printable Guest Folio / Official Billing Statement with `Print Folio` button. Defects: `VH-15` (stored XSS on `notes`), `VH-43` (omits `250.00` Service Fee from Grand Total and omits guest name from `"Billed To"`), `VH-57` (typo `"Thank you for your purchse"`). |
| `/guests` | `admin`, `staff` | `q` (search), `page` | Guest directory with reservation counts and total spend. Actions: `Add Guest`, `Edit Guest`, `Delete Guest`. Defects: `VH-45` (invalid phone accepted), `VH-46` (deleting guest with reservations leaves broken empty guest cells), `VH-57` (typo `"No custmers match your search"`), `VH-60`. |
| `/guests/[id]` | `admin`, `staff` | Dynamic route param `id` (`gst-01`..`gst-10`) | Guest profile card and guest reservation history table. Defect: `VH-47` (matches reservation history by first name instead of `guest_id`, merging `Maria Santos` and `Maria Reyes`). |
| `/reports` | `admin`, `staff` | `preset` (`7d`, `30d`, `month`, `custom`), `startDate`, `endDate` | Summary metrics (`Total Revenue`, `Reservations in Range`, `Discounts`, `Tax`), filtered reservations table, and `Export CSV` button. Defects: `VH-48`, `VH-49`, `VH-50`, `VH-51`. |
| `/users` | `admin` only | `q` (search), `role`, `status` | Staff user management (`Add User`, `Activate` / `Deactivate`). Defects: `VH-10` (accessible to `staff` via direct URL `/users`), `VH-12` (`admin` can deactivate their own account). |
| `/settings` | `admin`, `staff` | `tab` (`profile`, `security`, `appearance`, `notifications`) | Workspace settings. Defects: `VH-52` (Change Password ignores wrong current password), `VH-53` (Light theme resets to Dark on refresh), `VH-54` (Profile name update doesn't update topbar/greeting until refresh), `VH-55` (Disabling Low Allotment Alerts leaves badge `8` on bell). |
| `/*` (Catch-all) | Public / Auth | Unknown top-level path (e.g., `/nope`) | Renders proper custom 404 Not Found page (contrasting with `/rooms/does-not-exist` in `VH-56`). |

---

## 3. Supabase Sandbox API Route Handlers (`src/app/api/sandbox/`)

| Method | Path | Request Body / Params | Response & Behavior |
|---|---|---|---|
| `POST` | `/api/sandbox/init` | `{ sandboxId?: string }` | Creates or fetches the isolated `sandbox_id` slice in Supabase PostgreSQL and returns the complete seed/current state payload (`200 OK`). |
| `POST` | `/api/sandbox/sync` | `{ sandboxId: string, collection: string, payload: unknown }` | Persists client sandbox mutations (`users`, `rooms_packages`, `guests`, `reservations`) asynchronously to Supabase PostgreSQL (`200 OK`). |
| `POST` | `/api/sandbox/reset` | `{ sandboxId: string }` | Invokes Supabase RPC `reset_veranda_sandbox(p_sandbox_id)` to wipe and re-seed that browser's isolated dataset anchored to today (`Asia/Manila`), returning the fresh dataset (`200 OK`). |
| `GET` | `/api/health` | None | Returns `{ status: "ok", supabaseConnected: boolean, timestamp: string }` (`200 OK`). |

---

## 4. Form Validation Matrix (Canonical vs. Planted Defect Overrides)

| Form | Field | Canonical Rule | Planted Defect Override |
|---|---|---|---|
| **Login** | `email` | Required, trimmed, case-insensitive | `VH-01`: Not trimmed (`" admin@verandapms.test "` fails). |
| **Register** | `email` | Required, unique (case-insensitive) | `VH-06`: Case-sensitive check allows `Admin@verandapms.test`. |
| **Register** | `confirmPassword` | Must equal `password` | `VH-05`: Only checked when `password.length < 12`. |
| **Room / Package** | `name` | Required, trimmed length `>= 1` | `VH-23`: Checks `name.length > 0` without `.trim()`, allowing `"   "`. |
| **Room / Package** | `code` | Required, unique (case-insensitive) | `VH-22`: Case-sensitive check allows `sb-1001` when `SB-1001` exists. |
| **Room / Package** | `rate` | Required, numeric `> 0` | Validated properly (`rate <= 0` is rejected). |
| **Room / Package** | `available_units` | Required, integer `>= 0` | `VH-21`: Negative numbers (e.g., `-7`) are accepted. |
| **Adjust Allotment** | `quantity` (`remove`) | Integer `>= 1` and `<= available_units` | `VH-30`: Upper bound `<= available_units` is omitted on `remove`. |
| **Create Reservation** | `placedDate` | Valid date `<= today` | `VH-42`: Future dates are accepted. |
| **Create Reservation** | `discountPercent` | Numeric `0` to `100` | `VH-33`: Bounds check omitted (`150` and `-20` accepted). |
| **Create Reservation** | `items[].quantity` | Whole integer `>= 1`, sum per room `<= available_units` | `VH-31` (`0` allotment allowed), `VH-34` (`0` and `2.5` accepted), `VH-35` (checks per-line quantity instead of combined quantity across duplicate lines). |
| **Guest Form** | `phone` | Matches `/^[0-9+\-() ]+$/` | `VH-45`: Regex check omitted (`abc!!##xyz` accepted). |
| **Reports Filter** | `startDate`, `endDate` | `endDate >= startDate` | `VH-48`: Inverted range (`endDate < startDate`) shows no error and returns all records. |
| **Change Password** | `currentPassword` | Must match user's current password | `VH-52`: Current password check omitted. |
