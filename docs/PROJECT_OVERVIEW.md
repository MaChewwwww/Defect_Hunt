# Project Overview

**Status:** Specification baseline complete (Milestone M0).  
**Product Name:** **Veranda PMS** (Property, Room & Folio Management System)  
**Fictional Organization:** **Solstice Bay Resort & Villas**  
**Event Context:** Polytechnic University of the Philippines — Quezon City (PUPQC) BSIT Foundation Month — **Defect Hunt**

---

## 1. Problem, Purpose, and Competition Context

During the PUPQC BSIT Foundation Month, student contestants compete in **Defect Hunt**—a live Quality Assurance (QA) and software testing competition where participants inspect a realistic web application, identify planted software defects across multiple severity/difficulty tiers, and document reproducible bug reports (Steps to Reproduce, Expected Behavior, Actual Behavior, Category, and Module).

Two independent web applications are commissioned for the event so that separate competition rounds or divisions cannot share answers or rely on prior memorization:
- **System 1 (Co-Developer):** *ShopSphere (`Lumina Goods`)* — a Retail Warehouse Inventory & Sales Order Management System with a cyber-violet dark interface.
- **System 2 (This Repository):** **Veranda PMS (`Solstice Bay Resort & Villas`)** — a Boutique Hospitality, Room Allotment & Guest Folio Management System with an architectural **Cypress & Travertine** coastal resort interface.

**Veranda PMS** is designed to look, read, and operate like a real commercial B2B hospitality operations platform while embedding **60 deterministic, well-isolated defects (`VH-01` through `VH-60`)** distributed across **5 Easy**, **31 Medium**, and **24 Hard** items.

---

## 2. Fictional Company Profile: Solstice Bay Resort & Villas

**Solstice Bay Resort & Villas** is a premier Philippine coastal hospitality brand operating boutique casitas, oceanfront villas, marine charters, and wellness sanctuary experiences. Its front-office concierges, reservations specialists, and general management team use **Veranda PMS** as their daily unified workspace to:
- Monitor live room & package allotment availability (`available_units`) and housekeeping/maintenance blocks.
- Create, track, and transition guest reservations (`Pending -> Confirmed -> Checked In -> Checked Out` or `Cancelled`).
- Issue itemized **Guest Folios** (official hospitality billing statements) with Philippine 12% VAT and a fixed `PHP 250.00` Service & Environmental Fee.
- Maintain the **Guest Directory** and inspect individual guest stay histories and loyalty tiers.
- Audit daily and monthly resort occupancy/revenue performance and export accounting CSV reports.

All guests, staff members, room codes, rates, and folio transactions in this system are 100% synthetic.

---

## 3. User Roles & Per-Group Seed Accounts

Veranda PMS defines two application roles (`admin` and `staff`) plus an inactive account state (`is_active = false`), seeded separately for each of the 5 competition groups (`N = 1..5`):

| Role | Seed Email Pattern (`N = 1..5`) | Seed Password | Persona & Responsibilities | Canonical Boundary |
|---|---|---|---|---|
| **Admin** (`admin`) | `admin.groupN@verandapms.test` | `Admin@123` | **Elena Marasigan** (General Manager). Full access to Dashboard, Rooms & Packages (including creation, editing, allotment adjustments, and deletion), Reservations & Folios, Guests, Reports, Staff Accounts (`/users`), and Settings. | Cannot deactivate her own currently signed-in Admin account (`FR-USER-04`). |
| **Staff** (`staff`) | `staff.groupN@verandapms.test` | `Staff@123` | **Marco Villanueva** (Front Desk Concierge). Operational access to Dashboard, Rooms & Packages (view, create, edit, adjust allotment), Reservations & Folios, Guests, Reports, and personal Settings. | Cannot access `/users` (Staff management) and cannot delete Rooms & Packages (`FR-ROOM-05`, `FR-USER-01`). |
| **Staff (Deactivated)** | `former.groupN@verandapms.test` | `Former@123` | **Tricia Soriano** (Former Concierge, `is_active = false`). Retained for historical reservation attribution and access-control testing. | Blocked from signing in under all login options (`FR-AUTH-04`). |

---

## 4. Included Modules in v1

1. **Authentication & Account Recovery (`/login`, `/register`, `/forgot-password`, `/reset-password`)**:
   - Asymmetric split coastal hospitality login shell with interactive Demo Accounts reference card and footer **Reset demo data** trigger.
   - Staff self-registration flow, Remember Me session persistence toggle, and simulated single-use password reset link workflow.
2. **Executive Dashboard (`/dashboard`)**:
   - Period filter (`Last 7 days`, `Last 30 days`, `Last 90 days`, `All time`).
   - 4 KPI cards: **Total Revenue**, **Reservations Count**, **Average Booking Value (ABV)**, and **Low Allotment Alerts** (`available_units <= 5`).
   - **Monthly Revenue & Bookings Bar Chart** (interactive 6-month breakdown with hover tooltips).
   - **Low Allotment Watchlist** table (`available_units <= 5`) and **Recent Reservations** feed.
3. **Rooms & Packages Catalog (`/rooms`, `/rooms/[id]`)**:
   - Inventory of resort accommodations and concierge packages (`SB-1001` through `SB-1020`) across five categories: `Villas & Suites`, `Casitas & Rooms`, `Marine & Island Tours`, `Spa & Sanctuary`, and `Dining & Lounge`.
   - Search, Category filter, Status filter (`In Service`, `Low Allotment`, `Out of Stock`), numerical/alphabetical sorting, and pagination (10 items per page).
   - Create/Edit Room or Package modal/drawer, **Adjust Allotment** modal (`Add Units` / `Release to Maintenance` with reason), and Room Detail view with adjustment history.
4. **Reservations & Guest Folios (`/reservations`, `/reservations/new`, `/reservations/[id]`, `/reservations/[id]/folio`)**:
   - Reservation registry (`RSV-2001` through `RSV-2045`) with status filter (`All`, `Pending`, `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`), search, and date sorting.
   - Multi-line reservation builder with guest selector, check-in/reservation date, line items (`Room/Package` + `Nights/Units Quantity`), `Discount (%)`, live Folio Math breakdown, and `Special Requests / Folio Notes`.
   - Status lifecycle transitions (`Pending -> Confirmed -> Checked In -> Checked Out`, or `Cancelled` from `Pending`/`Confirmed`).
   - **Printable Guest Folio (`/reservations/[id]/folio`)**: Formatted hospitality billing statement with resort header, guest billing block, itemized charges, discount, 12% VAT, `PHP 250.00` Service & Environmental Fee, grand total, and browser print button.
5. **Guests Directory (`/guests`, `/guests/[id]`)**:
   - Guest profiles (`Maria Santos`, `Maria Reyes`, `Daniel Cruz`, `Rafael Mendoza`, etc.) with email, phone number, city/address, loyalty tier badge, total reservations count, and lifetime spend.
   - Guest detail view showing contact profile and complete chronological reservation history for that specific guest.
6. **Occupancy & Revenue Reports (`/reports`)**:
   - Date range presets (`Last 7 days`, `Last 30 days`, `This month`, `Last month`, `Custom range` with Start/End date inputs).
   - Summary KPI cards (`Total Revenue`, `Reservations in Range`, `Average Booking Value`, `Total Tax & Fees`).
   - Filtered reservations breakdown table and **Export CSV** download.
7. **Staff Users Management (`/users`)**:
   - Admin-only directory of resort accounts with role badges, active/inactive status badges, account creation, and Activate/Deactivate controls.
8. **Workspace Settings (`/settings`)**:
   - **Profile** tab (Full Name, Email), **Security** tab (Change Password with Current Password verification), **Appearance** tab (Dark Mode / Light Mode persistence), and **Notifications** tab (Low Allotment Alerts toggle synced with topbar notification bell).

---

## 5. Canonical Business Rules (The "Expected" Comparison Baseline)

Contestants and judges evaluate Veranda PMS against these exact canonical rules (displayed in validator documentation and summarized in onboarding):

1. **Folio Billing Formula**:
   - `Subtotal = sum(unit_rate * quantity)` across all line items in the reservation.
   - `Discount Amount = Subtotal * (discount_percent / 100)`.
   - `Net Subtotal = Subtotal - Discount Amount`.
   - `Tax (12% VAT) = 0.12 * (Subtotal - Discount Amount)`.
   - `Service & Environmental Fee = 250.00` (flat fee per reservation).
   - `Grand Total = (Subtotal - Discount Amount) + 12% VAT on (Subtotal - Discount Amount) + 250.00 Service & Environmental Fee`.
2. **Allotment Deduction & Restoration**:
   - Available units (`available_units`) are deducted **once** when a reservation is created (`Pending`) and are **restored** when a reservation is `Cancelled` (whether cancelled from `Pending` or `Confirmed`).
   - Transitioning from `Pending` to `Confirmed`, `Checked In`, or `Checked Out` does not deduct allotment a second time.
   - **Low Allotment** is defined as `available_units <= 5`.
3. **Historical Rate Immutability**:
   - Each reservation line item snapshots the room/package `unit_rate` at the time the reservation is created. Editing a room/package's rate later in `/rooms` must not alter the unit price or totals of existing reservations.
4. **Revenue & Average Booking Value (ABV)**:
   - Revenue **excludes** `Cancelled` reservations and **includes** the `250.00` Service & Environmental Fee.
   - `Average Booking Value (ABV) = Non-Cancelled Revenue / Non-Cancelled Reservation Count`.
5. **Date & Timezone Standard**:
   - All dates are rendered as `MM/DD/YYYY` in the user's local browser timezone (`Asia/Manila`, `UTC+8`).
   - Monthly chart groupings and daily date-range boundaries (`Last 7 days`, `Last 30 days`) evaluate timestamps in local time (`Asia/Manila`), inclusive of today.

---

## 6. Terminology

| Term | Definition in Veranda PMS |
|---|---|
| **Room / Package (`RoomPackage`)** | Any bookable resort accommodation (`Premier Oceanfront Villa`, `Deluxe Garden Casita`) or concierge experience (`Sunset Catamaran Charter`, `Deep Tissue Spa Ritual`) tracked by a unique code (`SB-1001`..`SB-1020`), nightly/unit rate, and `available_units` allotment pool. |
| **Allotment (`available_units`)** | The current number of available units or daily slots in service for a given Room or Package. Low allotment is `<= 5`. |
| **Reservation (`RSV-20XX`)** | A guest booking containing one or more Room/Package line items, a discount percentage, 12% VAT, a fixed `250.00` Service & Environmental Fee, and a lifecycle status (`Pending`, `Confirmed`, `Checked In`, `Checked Out`, `Cancelled`). |
| **Guest Folio** | The official itemized billing statement (`/reservations/[id]/folio`) generated for a reservation. |
| **Service & Environmental Fee** | Mandatory flat resort fee of `PHP 250.00` added once to every reservation's grand total. |
| **Sandbox (`sandbox_id`)** | Per-browser isolated dataset slice in Supabase PostgreSQL (mirrored to `localStorage`) so each contestant can mutate and reset demo data independently. |
| **Planted Defect (`VH-01`..`VH-60`)** | One of the 60 intentional, documented software bugs built into Veranda PMS for the PUPQC BSIT Defect Hunt competition. |

---

## 7. Excluded from Scope

To keep the competition focused and deterministic, Veranda PMS excludes:
- Real payment gateway integrations (Stripe, PayMongo, GCash).
- External OTA channel managers (Booking.com, Agoda, Airbnb sync).
- Multi-currency exchange rate conversion (all amounts are in `PHP`).
- Real outbound transactional email delivery (password reset links are displayed via an in-app simulated email preview modal/banner so contestants can test reset flows deterministically without external inbox dependencies).
- Real-time multi-user WebSocket chat.
