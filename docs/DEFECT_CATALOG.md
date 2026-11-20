# Veranda PMS Defect Hunt — Master Planted Defect Catalog

**All 60 planted defects, sorted from Easy to Hard**  
*Confidential — for organizers, developers, and validators only. Do not share with contestants.*

---

## System Metadata

| Field | Value |
|---|---|
| **System** | **Veranda PMS** — Hospitality, Room Allotment, and Guest Folio Management System (fictional resort operator **Solstice Bay Resort & Villas**, fictional data only) |
| **Deployment Target** | Vercel + Supabase (`https://veranda-pms.vercel.app`, Supabase `kvjywnrknfhuibtrnvpo` in `ap-southeast-1`) |
| **Total Defects** | **60** (`Easy: 5`, `Medium: 31`, `Hard: 24`) |

---

## Test Accounts

Each competition group (`1`–`5`) has its own isolated sandbox (`00000000-0000-4000-8000-000000000001`..`00000000-0000-4000-8000-000000000005`) with 3 seeded role accounts:

| Group / Role | Email | Password | Notes |
|---|---|---|---|
| **Group 1 — Coral Villa (Admin)** | `admin.group1@verandapms.test` | `Admin@123` | Elena Marasigan (isolated Group 1 sandbox) |
| **Group 1 — Coral Villa (Staff)** | `staff.group1@verandapms.test` | `Staff@123` | Marco Villanueva (isolated Group 1 sandbox) |
| **Group 1 — Coral Villa (Deactivated)** | `former.group1@verandapms.test` | `Former@123` | Tricia Soriano, inactive (isolated Group 1 sandbox) |
| **Group 2 — Cypress Cove (Admin / Staff / Deactivated)** | `admin.group2` / `staff.group2` / `former.group2@verandapms.test` | `Admin@123` / `Staff@123` / `Former@123` | Isolated Group 2 sandbox (`...0002`) |
| **Group 3 — Lagoon Sanctuary (Admin / Staff / Deactivated)** | `admin.group3` / `staff.group3` / `former.group3@verandapms.test` | `Admin@123` / `Staff@123` / `Former@123` | Isolated Group 3 sandbox (`...0003`) |
| **Group 4 — Terracotta Cliff (Admin / Staff / Deactivated)** | `admin.group4` / `staff.group4` / `former.group4@verandapms.test` | `Admin@123` / `Staff@123` / `Former@123` | Isolated Group 4 sandbox (`...0004`) |
| **Group 5 — Solstice Horizon (Admin / Staff / Deactivated)** | `admin.group5` / `staff.group5` / `former.group5@verandapms.test` | `Admin@123` / `Staff@123` / `Former@123` | Isolated Group 5 sandbox (`...0005`) |

---

## Before You Start (Validator & Organizer Notes)

- **Per-Browser Sandbox Isolation**: Data is isolated per browser (`sandbox_id` in Supabase mirrored to `localStorage`). Use **"Reset demo data"** in the footer of the login page to restore the original seed data at any time.
- **Timezone Requirements**: `VH-18` and `VH-44` only appear when the browser timezone is not `UTC`. `VH-18` requires a timezone ahead of `UTC`, such as `Asia/Manila` (`UTC+8`).
- **Canonical Rules for Comparison**:
  - `Grand Total = (Subtotal - Discount) + 12% VAT on (Subtotal - Discount) + 250.00 Service & Environmental Fee`.
  - Allotment (`available_units`) is deducted **once** when a reservation is created and restored on cancel.
  - **Low allotment** means `available_units` of `5` or less (`<= 5`).
  - **Revenue** excludes `Cancelled` reservations and includes the `250.00` Service & Environmental Fee.
  - **Dates** are formatted `MM/DD/YYYY` in local time (`Asia/Manila`).
- Older reservation numbers are anchored relative to the date the sandbox was initialized or reset, so older reservations are referenced by their content or seeded code.

---

## Easy (5 Defects)

| No. | ID | Module / Page | Category | Steps to Reproduce | Expected | Actual |
|---|---|---|---|---|---|---|
| 1 | `VH-23` | Rooms & Packages / form | Validation | Add a room or package whose name is only spaces (`"   "`). | `"Enter a room or package name."` | Saved with a blank-looking name. |
| 2 | `VH-40` | Reservations / list | Functional | Reservations -> Status filter `"Checked In"`. | Only `Checked In` reservations are listed. | `Checked Out` reservations are listed too. |
| 3 | `VH-45` | Guests / form | Validation | Add or edit a guest with phone `abc!!##xyz`. | Only digits, spaces, `+`, `-`, and parentheses allowed. | Accepted and saved. |
| 4 | `VH-48` | Reports | Validation | Set `End date` earlier than `Start date`. | Validation error shown; no data rows rendered. | No error; all reservations from all dates are shown. |
| 5 | `VH-53` | Settings / theme | Functional | The app opens in the dark theme by default. Switch to light mode (top bar toggle at `640px` and wider, or `Settings > Appearance > turn "Dark mode" off`), then refresh the page. | The chosen theme (light) is remembered across refresh. | The app returns to the default dark theme. |

---

## Medium (31 Defects)

| No. | ID | Module / Page | Category | Steps to Reproduce | Expected | Actual |
|---|---|---|---|---|---|---|
| 6 | `VH-01` | Auth / Login | Functional | On Login type ` admin.group1@verandapms.test ` (leading or trailing space, as when pasted) with password `Admin@123`, click Sign in. | Email is trimmed and login succeeds. | Rejected with the generic `"Invalid email or password."` error. |
| 7 | `VH-02` | Auth / Login | Usability | Fill valid credentials, put focus in the Password field, press `Enter`. Then put focus in the Email field and press `Enter`. | `Enter` submits the form from either field. | `Enter` in Password does nothing; `Enter` in Email submits. |
| 8 | `VH-03` | Auth / Login | Security | Sign in with `nobody@verandapms.test` / any password, note the message. Then `admin.group1@verandapms.test` / wrong password. | Identical message in both cases (`"Invalid email or password."`). | Unknown email: `"Invalid email or password."` Existing email: `"Incorrect email or password."` (account enumeration). |
| 9 | `VH-06` | Auth / Register | Validation | Register with email `Admin.group1@verandapms.test` (capital `A`). | Rejected as a duplicate (emails are unique, case-insensitive). | Account is created. (`admin.group1@verandapms.test` in exact lowercase is rejected.) |
| 10 | `VH-08` | Auth / Session | Security | Sign in with `"Remember me"` unchecked. Open the app URL in a new tab (or close and reopen the browser). Check `DevTools > Application > Storage`. | Session is tab-scoped (`sessionStorage`); a new tab asks for login. | Session is stored in `localStorage` (`veranda.v1.session`); the new tab is already signed in. |
| 11 | `VH-09` | Auth / Login | Security | Sign in as `former.group1@verandapms.test` / `Former@123` with `"Remember me"` unchecked (blocked). Tick `"Remember me"` and sign in again. | Deactivated accounts are always blocked. | Login succeeds when `"Remember me"` is ticked. |
| 12 | `VH-10` | Access control / Users | Security | Sign in as Staff (`staff.group1@verandapms.test`). The `Users` menu item is hidden in the sidebar. Type `/users` in the address bar. | Access denied or redirect to `/dashboard`. | The `/users` page opens and is fully functional. |
| 13 | `VH-11` | Access control / Room detail | Security | Sign in as Staff. The Rooms & Packages list (`/rooms`) has no delete button. Open any room detail page (`/rooms/[id]`) and click `Delete`. | No Delete button for Staff on the detail page either. | Staff can see and click Delete to remove the room/package. |
| 14 | `VH-12` | Users | Functional | Sign in as Admin, open `/users`, click `Deactivate` on your own row (`Elena Marasigan`). | Not allowed (button disabled or error message). | The admin deactivates their own account and is signed out on the next page load. |
| 15 | `VH-16` | Dashboard | Functional | Dashboard, `"Last 30 days"` (contains Cancelled reservation `RSV-2037`). Compare `Total Revenue` with the sum of the non-cancelled reservation totals in the same period (Reservations list). | Cancelled reservations are excluded from revenue. | `Total Revenue` includes the cancelled reservation totals. |
| 16 | `VH-19` | Dashboard | Functional | Select `"Last 7 days"`. Compare the `Reservations` KPI count with `Reports > "Last 7 days"` or the Reservations list (three reservations `RSV-2043`, `RSV-2044`, `RSV-2045` were placed today). | Today's reservations are included. | The range ends yesterday; today's three reservations are excluded. |
| 17 | `VH-21` | Rooms & Packages / form | Validation | Add or edit a room/package with Available Units (allotment) `-7`. | `"Allotment cannot be negative"` (rate is validated correctly). | Saved with allotment `-7`. |
| 18 | `VH-22` | Rooms & Packages / form | Validation | Add a room/package with Code `sb-1001` (`SB-1001` exists). | Rejected as a duplicate room/package code. | Accepted; the uniqueness check is case-sensitive (`SB-1001` exact is rejected). |
| 19 | `VH-24` | Reservations / Create | UI | Create Reservation -> select `SB-1009` (the `"Solstice Bay Presidential Sanctuary ..."` villa) -> click `Add`. | The name truncates or wraps; Quantity and Rate stay visible inside the card. | The row grows wider than the card; Unit rate, Quantity, and Line total are pushed out of view and only reachable by horizontal scrolling. |
| 20 | `VH-25` | Rooms & Packages / list | Functional | Filter `Category = Villas & Suites` (12 items). Click `Next` / page `2`. | Page 2 of the filtered list (2 items). | The category filter is dropped; page 2 of all items is shown (search, status, and sort are kept). |
| 21 | `VH-27` | Rooms & Packages / detail | Usability | As Admin, delete from the `/rooms` list (confirmation dialog appears). Then open any room detail page (`/rooms/[id]`) and click `Delete`. | Confirmation dialog appears in both places. | The detail page deletes immediately without confirmation. |
| 22 | `VH-30` | Rooms & Packages / Adjust allotment | Validation | `Terracotta Courtyard Suite` (allotment `7`): `Adjust allotment > Remove`, quantity `50`, any reason. | Rejected: cannot remove more than current available units. | Accepted; allotment becomes `-43`. |
| 23 | `VH-31` | Reservations / Create | Functional | Create reservation -> Add room/package -> `Cliffside Infinity Pavilion` (`0` available, badge `"Out of allotment"`) -> Add, then place the reservation. | Out-of-allotment items cannot be added or booked. | It can be added and booked; allotment goes negative. |
| 24 | `VH-33` | Reservations / Create | Validation | Enter `Discount` `150`, or `-20`, and place the reservation. | Discount must be between `0` and `100`. | Both are accepted (resulting in negative totals or a surcharge). |
| 25 | `VH-34` | Reservations / Create | Validation | Set a line quantity to `0` or `2.5` and place the reservation. | Quantity must be a whole number of at least `1`. | Accepted; allotment becomes fractional for `2.5`. Negative values are rejected. |
| 26 | `VH-37` | Reservations / status | Functional | Open any `Checked Out` reservation: the status dropdown offers `Pending`, `Confirmed`, `Checked In`. Open `Cancelled` reservation `RSV-2037`: it offers `Checked In`, `Checked Out`, etc. | Only the next forward step (or `Cancelled` from `Pending`/`Confirmed`) is allowed; `Checked Out` and `Cancelled` are final. | Status can move backwards and a `Cancelled` reservation can be reopened. |
| 27 | `VH-39` | Reservations / detail | Functional | Compare the total of `RSV-2045` in the Reservations list (`1,370.00`) with the `Total` on its detail page (`/reservations/rsv-2045`). | Same total (`1,370.00`) on both screens. | Detail page shows `1,620.00`: the `250.00` Service & Environmental Fee is added twice. |
| 28 | `VH-41` | Reservations / Create | Functional | Fill a valid reservation and double-click `"Place Reservation"`. | One reservation created; the submit button is disabled while submitting. | Two identical reservations are created (two toasts, consecutive numbers) and allotment is deducted twice. |
| 29 | `VH-42` | Reservations / dates | Validation / UI | Create a reservation with a Reservation date in the future. Then compare the date in the Reservations list with the `"Placed"` date on the detail page. | Future dates are rejected; dates are `MM/DD/YYYY` everywhere. | Future date accepted; the detail page shows `DD/MM/YYYY`. |
| 30 | `VH-46` | Guests / Reservations | Data | Delete guest `Daniel Cruz` (has reservations). Open Reservations and find his reservations; click inside the empty Guest cell. | Deleting a guest with reservations is blocked (or reservations keep the snapshot guest name). | Deletion succeeds; the reservations show an empty Guest cell whose link opens a blank page. |
| 31 | `VH-52` | Settings / Change password | Security | Enter a wrong `Current password`, a valid new password, and matching confirmation. | `"Current password is incorrect."` | Password is changed without verifying the current password. |
| 32 | `VH-54` | Settings / Profile | Functional | Change `Full name` and save. Look at the name and initials in the top bar (and the Dashboard greeting). | Updated immediately across the workspace. | Old name and initials remain until the page is refreshed. |
| 33 | `VH-56` | Routing | Usability | Open `/rooms/does-not-exist` (also `/reservations/does-not-exist`). Compare with `/nope`. | A not-found message on all unknown routes. | A loading skeleton is shown forever on unknown dynamic IDs. Unknown top-level URLs (`/nope`) show the proper 404. |
| 34 | `VH-57` | Text | UI | Guests: search `zzzz` -> `"No custmers match your search"`. Folio footer -> `"Thank you for your purchse"`. Toasts: `"Room succesfully updated."` (edit room), `"Stock adjusment recorded."` (allotment adjustment), `"Reservation status udpated."` (status change). | Correct spelling in all UI strings. | Five spelling mistakes in low-traffic places. |
| 35 | `VH-58` | Layout / mobile drawer | UI | Use a viewport narrower than `640px` (e.g., `390px`). Tap the menu (hamburger) button in the top bar to open the navigation drawer, then tap a menu item such as `Reservations`. | The app navigates to the page and the drawer closes automatically. | The page changes underneath, but the drawer stays open and keeps covering the content; it only closes via the backdrop or the close (`X`) button. |
| 36 | `VH-59` | Accessibility | Accessibility | (a) Hover / inspect icon-only buttons (hamburger, sidebar collapse toggle, theme toggle, bell, drawer close, table edit/delete, modal close): no tooltip, no accessible name. (b) Tab through the page: no visible focus outline on buttons and links. (c) Open any modal and press `Esc`. | Icon buttons are labelled, focus is visible, `Esc` closes dialogs. | None of the three. (Sidebar navigation links are labelled correctly, including in the collapsed icon rail.) |

---

## Hard (24 Defects)

| No. | ID | Module / Page | Category | Steps to Reproduce | Expected | Actual |
|---|---|---|---|---|---|---|
| 37 | `VH-04` | Auth / Login | Security | Submit a wrong password 5 times for `admin.group1@verandapms.test` until `"Too many attempts, try again later."` appears. Then enter `Admin@123` and sign in. | Login is blocked for a lockout period. | Login succeeds immediately; the lockout is only a message. |
| 38 | `VH-05` | Auth / Register | Validation | Register with password `LongPassword12` and confirm `Different12345` (12+ characters). Compare with `Password1` / `Password2`. | `"Passwords do not match"` in both cases. | Mismatch is only caught when the password is shorter than 12 characters; the 12+ character case creates the account. |
| 39 | `VH-07` | Auth / Reset password | Security | Forgot password for `staff.group1@verandapms.test`, click `"Open reset link"`, copy the URL, set a new password. Open the copied URL again and set another password. | The link is single-use; the second visit shows an invalid/expired message. | The same link works again (until its 30-minute expiry). |
| 40 | `VH-13` | Access control / Session | Security | Sign in as Staff. In `DevTools > Application > Local Storage` edit `veranda.v1.session`: change `"role":"staff"` to `"role":"admin"`. Reload. | Role comes from the user record; tampering has no effect. | `Users` menu and room delete buttons appear; the app trusts the stored session role. |
| 41 | `VH-14` | Data storage | Security | Inspect `DevTools > Application > Local Storage > veranda.v1.db > users`. | Passwords are hashed. | Passwords are stored in plain text (`"password":"Admin@123"`). |
| 42 | `VH-15` | Reservations / Folio | Security | Create a reservation with notes `<img src=x onerror="alert(1)">`. Open the reservation detail (notes shown safely as text). Click `"View folio"`. | Notes are escaped everywhere. | The alert fires on the folio page only (stored XSS). |
| 43 | `VH-17` | Dashboard | Functional | Compare the `Low Allotment` KPI (`8`) with the number of rows in the `Low allotment` watchlist (`7`). | Both use `available_units <= 5`; `Coral Reef Private Cabana` (allotment `5`) is listed. | The list uses `available_units < 5`, so `Coral Reef Private Cabana` is missing. |
| 44 | `VH-18` | Dashboard / chart | Functional | Browser timezone ahead of UTC (e.g., `Asia/Manila` `UTC+8`). Hover last month's bar and note revenue and reservation count. Compare with Reports for that calendar month (Reservations count; the reservation placed at `12:30 AM` on the 1st). | The reservation placed at `12:30 AM` local time on the 1st counts in that month. | Reservations are grouped by UTC month, so that reservation is counted in the previous month's bar. |
| 45 | `VH-20` | Dashboard | Functional | `"Last 30 days"`: compute non-cancelled revenue divided by non-cancelled reservation count and compare with `Average Booking Value`. | `ABV = non-cancelled revenue / non-cancelled reservations`. | It divides by the count of all reservations including `Cancelled` ones, so ABV is too low. |
| 46 | `VH-26` | Rooms & Packages / list | Functional | Sort `"Rate (high to low)"`. | `6,400.00` first, then descending numerically. | Sorted as text: `990.00`, `975.00`, `950.00`, `900.00` ... appear above `6,400.00` and `1,200.00`. Ascending sort is correct. |
| 47 | `VH-28` | Rooms & Packages / Edit | Functional | Edit `"Eucalyptus Steam & Spa Ritual"`: change the Name and change Rate to `555`, then click `Cancel`. | Nothing is saved. | The new rate (`555`) is saved (name change is discarded). |
| 48 | `VH-29` | Reservations / Rooms | Data | Note the total of `RSV-2045` (`Teakwood Lanai Daybed` x2, `1,370.00`). Edit `Teakwood Lanai Daybed` in `/rooms` and change its rate. Reopen `RSV-2045`. | Existing reservations keep the unit rate from booking time. | The unit rate and totals of the existing reservation change (also in Dashboard and Reports). |
| 49 | `VH-32` | Reservations / totals | Functional | Create reservation: `Sunset Catamaran Charter` x2 (`2,400.00`), discount `10`. Or open seeded `RSV-2044` (`5%` discount). | `Tax = 12% of (2,400 - 240) = 259.20`; total `2,669.20` (with `250.00` fee). | `Tax = 12% of 2,400 = 288.00`; total `2,698.00`. Wrong whenever a discount is applied. |
| 50 | `VH-35` | Reservations / Create | Functional | Add `Island Kayaking & Snorkeling Expedition` (`23` available) twice as two lines with quantity `20` each. (A single line of `24` shows `"Only 23 available"`.) | Combined quantity across lines is validated against available allotment. | Reservation is accepted; allotment becomes `-17`. |
| 51 | `VH-36` | Reservations / status | Functional | Note the allotment of `Teakwood Lanai Daybed` (`26`). Open `RSV-2045` (`Confirmed`) and change status to `Cancelled`. Compare with cancelling `RSV-2044` (`Pending`), which restores allotment. | Allotment is restored (`26 -> 28`). | Allotment stays `26` for a cancelled `Confirmed` reservation. |
| 52 | `VH-38` | Reservations / status | Functional | Note allotment of `Cabana Suite, Poolside` (`34`) and `Botanical Welcome Amenity Set` (`96`). Open `RSV-2043` (`Pending`) and change status to `Confirmed`. | Allotment unchanged (already deducted at creation). | Allotment is deducted again (`33` and `93`). |
| 53 | `VH-43` | Reservations / Folio | Functional | Open `RSV-2045` -> click `"View folio"`. | Grand total `1,370.00` and `"Billed to"` shows `Maria Reyes`. | Grand total is `1,120.00` (Service & Environmental Fee row `250.00` is shown but not added) and the guest name is missing (only email, phone, address shown). |
| 54 | `VH-44` | Reservations / detail | UI | Browser not on UTC (e.g., `UTC+8`). Compare the time of a reservation in the Reservations list with `"Placed ..."` on its detail page. | Same local time on both screens. | Detail page shows the UTC time (`8 hours earlier` in `UTC+8`; the date can also differ around midnight). |
| 55 | `VH-47` | Guests / detail | Functional | Guests list shows `Maria Santos = 6 reservations`, `Maria Reyes = 3`. Open either detail page (`/guests/gst-01` or `/guests/gst-02`). | Only that specific guest's reservations are shown. | Each shows `9` reservations: history is matched by first name (`"Maria"`), so both Marias see each other's reservations. |
| 56 | `VH-49` | Reports / CSV | Data | Export a range containing a reservation with `"Cabana Suite, Poolside"` (e.g., `Last 7 days`: `RSV-2041`, `RSV-2043`). Open the CSV. | Field is quoted: `"Cabana Suite, Poolside"`. | Unquoted; the row has an extra column and the following columns shift right. |
| 57 | `VH-50` | Reports / CSV | Data | Note `"Reservations in range"` row count (e.g., `Last 7 days`), export CSV, count the CSV data rows. | Same number of data rows. | The last row in the table (the oldest reservation in the range, e.g., `RSV-2040` in `Last 7 days`) is missing. |
| 58 | `VH-51` | Reports | Functional | Compare the `"Total Revenue"` summary card on Reports with the sum of the `Total` column for non-cancelled rows (or with `Subtotal - Discounts + Tax + 250 * Reservations`). | Revenue includes the `250.00` Service & Environmental Fee. | Summary = `Subtotal - Discounts + Tax`; the `250.00` fee per reservation is excluded, so it never matches the Dashboard. |
| 59 | `VH-55` | Notifications | Functional | `Settings > Notifications` -> turn `"Low allotment alerts"` off. Look at the notification bell in the top bar. | No numeric badge on the bell. | The dropdown is empty (`"You are all caught up."`) but the bell badge still shows `8`. |
| 60 | `VH-60` | Rooms / Guests | Data | Open `Edit` for the same room/package (or guest) in two browser tabs (`Tab A` and `Tab B`). In `Tab A` change the description and save. In `Tab B` change the name and save. | `Tab B` is warned that the record changed (or changes are merged). | `Tab B` silently overwrites `Tab A`'s change with its stale values. |
